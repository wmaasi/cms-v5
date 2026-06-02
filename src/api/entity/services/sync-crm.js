'use strict';

const { BigQuery } = require('@google-cloud/bigquery');

/** Utils **/
const toUpper = (v) => (typeof v === 'string' ? v.trim().toUpperCase() : null);
const cleanStr = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};
const toBoolAsociado = (v) => {
  const s = String(v || '').trim().toLowerCase();
  return s === 'sí' || s === 'si' || s === 'true';
};
const toDateStr = (v) => {
  if (!v) return null;
  try { return new Date(v).toISOString().split('T')[0]; } catch { return null; }
};

/** Caches precargados **/
const cache = {
  countryByNameSp: new Map(),
  sectorByCrm:     new Map(),
  commissionByCrm: new Map(),
  committeeByCrm:  new Map(),
  entityByNit:     new Map(),
  entityByCrmCode: new Map(),
};

async function preloadCatalogs() {
  const countries = await strapi.documents('api::country.country').findMany({
    fields: ['id', 'name_sp'],
    limit: 10000,
  });
  for (const c of countries) {
    const key = toUpper(c.name_sp);
    if (key) cache.countryByNameSp.set(key, c.id);
  }

  const [sectors, commissions, committees] = await Promise.all([
    strapi.documents('api::sector.sector').findMany({         fields: ['id', 'crmName'], limit: 10000 }),
    strapi.documents('api::commission.commission').findMany({ fields: ['id', 'crmName'], limit: 10000 }),
    strapi.documents('api::committee.committee').findMany({   fields: ['id', 'crmName'], limit: 10000 }),
  ]);

  for (const r of sectors)     { const k = toUpper(r.crmName); if (k) cache.sectorByCrm.set(k, r.id); }
  for (const r of commissions) { const k = toUpper(r.crmName); if (k) cache.commissionByCrm.set(k, r.id); }
  for (const r of committees)  { const k = toUpper(r.crmName); if (k) cache.committeeByCrm.set(k, r.id); }
}

async function preloadEntities() {
  strapi.log.info('[SYNC CRM] Precargando entidades existentes...');
  let page = 1;
  const pageSize = 500;

  while (true) {
    const batch = await strapi.documents('api::entity.entity').findMany({
      fields: ['id', 'documentId', 'nit', 'crmCode', 'name', 'legal_name', 'phone', 'email',
               'webpage', 'address', 'associated', 'entry_date', 'desc'],
      populate: {
        country:     { fields: ['id'] },
        sectors:     { fields: ['id'] },
        commissions: { fields: ['id'] },
        committees:  { fields: ['id'] },
      },
      limit: pageSize,
      start: (page - 1) * pageSize,
    });

    if (!batch.length) break;

    for (const entity of batch) {
      const nit     = toUpper(cleanStr(entity.nit));
      const crmCode = toUpper(cleanStr(entity.crmCode));
      if (nit)     cache.entityByNit.set(nit, entity);
      if (crmCode) cache.entityByCrmCode.set(crmCode, entity);
    }

    if (batch.length < pageSize) break;
    page++;
  }

  strapi.log.info(`[SYNC CRM] Entidades precargadas: ${cache.entityByNit.size} por NIT, ${cache.entityByCrmCode.size} por crmCode`);
}

/** Compara si los datos de Gold son distintos al registro en Strapi **/
function hasChanged(existing, data) {
  const plainFields = ['name', 'legal_name', 'nit', 'crmCode', 'phone', 'email',
                       'webpage', 'address', 'associated', 'desc'];
  for (const field of plainFields) {
    const a = existing[field] ?? null;
    const b = data[field] ?? null;
    if (String(a) !== String(b)) return true;
  }

  const existingDate = toDateStr(existing.entry_date);
  const newDate      = toDateStr(data.entry_date);
  if (existingDate !== newDate) return true;

  const existingCountry = existing.country?.id ?? null;
  const newCountry      = data.country ?? null;
  if (existingCountry !== newCountry) return true;

  for (const rel of ['sectors', 'commissions', 'committees']) {
    const existingIds = (existing[rel] || []).map(r => r.id).sort().join(',');
    const newIds      = [...(data[rel] || [])].sort().join(',');
    if (existingIds !== newIds) return true;
  }

  return false;
}

/** Resuelve el ID de país desde el nombre en Gold **/
async function resolveCountryId(paisName) {
  const key = toUpper(cleanStr(paisName));
  return key ? (cache.countryByNameSp.get(key) || null) : null;
}

/** Resuelve IDs de sector, comisión y comité desde los nombres en Gold **/
function resolveIds(nombres, mapByCrm) {
  if (!nombres) return [];
  const out = [];
  for (const nombre of nombres.split('|')) {
    const key = toUpper(nombre.trim());
    const id  = mapByCrm.get(key);
    if (id) out.push(id);
  }
  return out;
}

/** Lee los asociados desde gold_crm.asociados en BigQuery **/
async function fetchFromBigQuery() {
  strapi.log.info('[SYNC CRM] Leyendo asociados desde gold_crm.asociados...');

  const bigquery  = new BigQuery();
  const projectId = process.env.GCP_PROJECT_ID || 'flawless-agency-347915';

  const query = `
    SELECT
      codigoCrm,
      nombreComercial,
      razonSocial,
      nit,
      telefono,
      email,
      paginaWeb,
      direccion,
      asociado,
      fechaAlta,
      descripcion,
      pais,
      sector,
      comision,
      comite
    FROM \`${projectId}.gold_crm.asociados\`
    WHERE activo = 'Activo'
  `;

  const [rows] = await bigquery.query({ query });
  strapi.log.info(`[SYNC CRM] Asociados leídos desde BigQuery: ${rows.length}`);
  return rows;
}

module.exports = async () => {
  try {
    strapi.log.info('[SYNC CRM] Ejecutando sincronización desde gold_crm...');

    // 1) Leer datos desde BigQuery
    const empresas = await fetchFromBigQuery();

    // 2) Precargar catálogos y entidades existentes
    await preloadCatalogs();
    await preloadEntities();

    let created = 0, updated = 0, unchanged = 0, skipped = 0, deassociated = 0;
    let missCountry = 0, missSector = 0, missCommission = 0, missCommittee = 0;

    const seenDocumentIds = new Set();

    for (const e of empresas) {
      const name       = cleanStr(e.nombreComercial) || cleanStr(e.razonSocial) || 'SIN NOMBRE';
      const legal_name = cleanStr(e.razonSocial) || null;
      const nit        = cleanStr(e.nit);
      const crmCode    = cleanStr(e.codigoCrm);

      if (!nit && !crmCode) {
        strapi.log.warn(`[SYNC CRM] Sin NIT ni CRM Code para: ${name}. Saltando.`);
        skipped++;
        continue;
      }

      // --- Relaciones ---
      const countryId     = await resolveCountryId(e.pais);
      const sectorIds     = resolveIds(e.sector,   cache.sectorByCrm);
      const commissionIds = resolveIds(e.comision, cache.commissionByCrm);
      const committeeIds  = resolveIds(e.comite,   cache.committeeByCrm);

      if (!countryId && e.pais) {
        missCountry++;
        strapi.log.warn(`[SYNC CRM] Country no encontrado: "${e.pais}"`);
      }
      if (!sectorIds.length && e.sector) {
        missSector++;
        strapi.log.warn(`[SYNC CRM] Sector no encontrado: "${e.sector}"`);
      }
      if (!commissionIds.length && e.comision) {
        missCommission++;
        strapi.log.warn(`[SYNC CRM] Commission no encontrada: "${e.comision}"`);
      }
      if (!committeeIds.length && e.comite) {
        missCommittee++;
        strapi.log.warn(`[SYNC CRM] Committee no encontrado: "${e.comite}"`);
      }

      // --- Payload ---
      const data = {
        name,
        legal_name,
        nit:        nit     || null,
        crmCode:    crmCode || null,
        phone:      cleanStr(e.telefono)    || null,
        email:      cleanStr(e.email)       || null,
        webpage:    cleanStr(e.paginaWeb)   || null,
        address:    cleanStr(e.direccion)   || null,
        associated: toBoolAsociado(e.asociado),
        entry_date: e.fechaAlta ? new Date(e.fechaAlta.value || e.fechaAlta) : null,
        desc:       cleanStr(e.descripcion) || null,
        country:     countryId     || null,
        sectors:     sectorIds,
        commissions: commissionIds,
        committees:  committeeIds,
        type: 'Asociado',
        licencse: 1,
      };

      // --- Buscar en cache ---
      const existing = (nit     && cache.entityByNit.get(toUpper(nit)))
                    || (crmCode && cache.entityByCrmCode.get(toUpper(crmCode)))
                    || null;

      if (existing) {
        seenDocumentIds.add(existing.documentId);
        if (hasChanged(existing, data)) {
          await strapi.documents('api::entity.entity').update({
            documentId: existing.documentId,
            data,
          });
          await strapi.documents('api::entity.entity').publish({
            documentId: existing.documentId,
          });
          updated++;
        } else {
          unchanged++;
        }
      } else {
        const created_entity = await strapi.documents('api::entity.entity').create({
          data: {
            ...data,
            publishedAt: new Date().toISOString(), // publicar directamente
          },
        });
        seenDocumentIds.add(created_entity.documentId);
        if (nit)     cache.entityByNit.set(toUpper(nit), created_entity);
        if (crmCode) cache.entityByCrmCode.set(toUpper(crmCode), created_entity);
        created++;
      }

      if ((updated + created + unchanged) % 100 === 0) {
        strapi.log.info(`[SYNC CRM] Progreso: ${updated + created + unchanged + skipped}/${empresas.length} (updated=${updated}, unchanged=${unchanged}, created=${created})`);
      }
    }

    // Des-asociar entidades que ya no vienen de Gold
    if (seenDocumentIds.size > 0) {
      const allCachedByDocId = new Map();
      for (const entity of cache.entityByNit.values())     allCachedByDocId.set(entity.documentId, entity);
      for (const entity of cache.entityByCrmCode.values()) allCachedByDocId.set(entity.documentId, entity);

      for (const [documentId, entity] of allCachedByDocId) {
        if (!seenDocumentIds.has(documentId) && entity.associated === true) {
          await strapi.documents('api::entity.entity').update({
            documentId,
            data: {
              associated: false,
              type: 'No Asociado',
              license: 2,
            },
          });
          await strapi.documents('api::entity.entity').publish({
            documentId,
          });
          deassociated++;
          strapi.log.info(`[SYNC CRM] Des-asociado: "${entity.name}" (documentId=${documentId})`);
        }
      }
    }

    strapi.log.info(`[SYNC CRM] Finalizado ✅ created=${created}, updated=${updated}, unchanged=${unchanged}, skipped=${skipped}, deassociated=${deassociated}`);
    if (missCountry)    strapi.log.warn(`[SYNC CRM] Countries faltantes: ${missCountry}`);
    if (missSector)     strapi.log.warn(`[SYNC CRM] Sectors faltantes: ${missSector}`);
    if (missCommission) strapi.log.warn(`[SYNC CRM] Commissions faltantes: ${missCommission}`);
    if (missCommittee)  strapi.log.warn(`[SYNC CRM] Committees faltantes: ${missCommittee}`);

  } catch (err) {
    strapi.log.error('[SYNC CRM] Error general:');
    strapi.log.error(err?.message || err);
    throw err;
  }
};