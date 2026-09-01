'use strict';

/**
 * Script de migración — correr UNA SOLA VEZ
 *
 * Asigna la licencia "Acceso Completo 365" a todas las entidades
 * que tienen type = 'Asociado' y que no tienen licencia asignada.
 *
 * Uso:
 *   node scripts/assign-license-to-asociados.js
 */

const strapi = require('@strapi/strapi');

const LICENSE_DOC_ID = '3e7fc04f-9ab8-4065-9fad-25cc75723df2';
const PAGE_SIZE      = 200;

async function main() {
  const app = await strapi().load();

  try {
    console.log('🔍 Buscando entidades con type=Asociado sin licencia...');

    let page     = 1;
    let total    = 0;
    let updated  = 0;
    let skipped  = 0;

    while (true) {
      const batch = await app.documents('api::entity.entity').findMany({
        filters: {
          type: 'Asociado',
          license: { $null: true },
        },
        fields: ['id', 'documentId', 'name', 'type'],
        populate: { license: { fields: ['id'] } },
        limit: PAGE_SIZE,
        start: (page - 1) * PAGE_SIZE,
      });

      if (!batch.length) break;
      total += batch.length;

      for (const entity of batch) {
        // Doble chequeo: saltarse si ya tiene licencia
        if (entity.license) {
          skipped++;
          continue;
        }

        await app.documents('api::entity.entity').update({
          documentId: entity.documentId,
          data: { license: LICENSE_DOC_ID },
        });
        await app.documents('api::entity.entity').publish({
          documentId: entity.documentId,
        });

        updated++;
        console.log(`  ✅ [${updated}] ${entity.name} (${entity.documentId})`);
      }

      if (batch.length < PAGE_SIZE) break;
      page++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Finalizado: total=${total}, updated=${updated}, skipped=${skipped}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Error:', err?.message || err);
    process.exit(1);
  } finally {
    await app.destroy();
    process.exit(0);
  }
}

main();

