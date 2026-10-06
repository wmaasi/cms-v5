'use strict';

/**
 * Elimina usuarios duplicados basados en email.
 */
function uniqUsers(users) {
  const map = new Map();
  users.forEach((u) => {
    if (!u || !u.email) return;
    const email = u.email.trim().toLowerCase();
    if (!map.has(email)) map.set(email, u);
  });
  return [...map.values()];
}

/**
 * Obtiene los usuarios que deben recibir la notificación según las reglas del campo `notify`.
 *
 * Los segmentos sector/commission/committee/user_tags se COMBINAN (OR): un usuario
 * que califique por cualquiera de ellos entra a la lista.
 *
 * entity_type, si está seleccionado, actúa como FILTRO adicional (AND) sobre esa
 * lista ya combinada: solo se conservan los usuarios cuya entidad tenga uno de los
 * tipos seleccionados (ej. "Comisión = Cítricos" + "Entity Type = Asociado" envía
 * solo a los asociados de Cítricos, no a todos los de Cítricos).
 *
 * @param {string} uid - UID del content-type (api::doc.doc o api::tradeshow.tradeshow)
 * @param {string} documentId - documentId del documento (en v5 es string UUID, no número)
 *
 * @returns {Promise<Array>} Lista de usuarios { id, email }
 */
async function resolveRecipientsByNotify(uid, documentId) {
  const item = await strapi.documents(uid).findOne({
    documentId,
    populate: {
      notify: true,
      sectors: true,
      commissions: true,
      committees: true,
      tags: true,
      entity_types: true,
    },
  });
  if (!item) return [];
  const notifyKinds = [].concat(item.notify || []).map((n) => n.kind);
  if (!notifyKinds.length) return [];
  const sectorIds      = (item.sectors      || []).map((s) => s.id);
  const commissionIds  = (item.commissions  || []).map((c) => c.id);
  const committeeIds   = (item.committees   || []).map((c) => c.id);
  const tagIds         = (item.tags         || []).map((t) => t.id);
  const entityTypeNames = (item.entity_types || []).map((e) => e.type).filter(Boolean);

  const finalBuckets = [];

  // ======================================================
  // 1. NOTIFICAR POR SECTOR
  // ======================================================
  if (notifyKinds.includes('sector') && sectorIds.length > 0) {
    const users = await strapi.documents('api::brain-user.brain-user').findMany({
      fields: ['id', 'email'],
      filters: {
        entity: {
          sectors: { id: { $in: sectorIds } },
        },
      },
      limit: 100000,
    });
    finalBuckets.push(users);
  }

  // ======================================================
  // 2. NOTIFICAR POR COMMISSION
  // ======================================================
  if (notifyKinds.includes('commission') && commissionIds.length > 0) {
    const users = await strapi.documents('api::brain-user.brain-user').findMany({
      fields: ['id', 'email'],
      filters: {
        entity: {
          commissions: { id: { $in: commissionIds } },
        },
      },
      limit: 100000,
    });
    finalBuckets.push(users);
  }

  // ======================================================
  // 3. NOTIFICAR POR COMMITTEE
  // ======================================================
  if (notifyKinds.includes('committee') && committeeIds.length > 0) {
    const users = await strapi.documents('api::brain-user.brain-user').findMany({
      fields: ['id', 'email'],
      filters: {
        entity: {
          committees: { id: { $in: committeeIds } },
        },
      },
      limit: 100000,
    });
    finalBuckets.push(users);
  }

  // ======================================================
  // 4. NOTIFICAR POR USER TAGS
  // ======================================================
  if (notifyKinds.includes('user_tags') && tagIds.length > 0) {
    const users = await strapi.documents('api::brain-user.brain-user').findMany({
      fields: ['id', 'email'],
      filters: {
        tags: { id: { $in: tagIds } },
      },
      limit: 100000,
    });
    finalBuckets.push(users);
  }

  // ======================================================
  // Unificar y deduplicar los segmentos combinables (OR)
  // ======================================================
  let finalList = uniqUsers(finalBuckets.flat());

  // ======================================================
  // 5. FILTRAR POR ENTITY TYPE (AND, aplicado al final)
  // ======================================================
  if (notifyKinds.includes('entity_type') && entityTypeNames.length > 0 && finalList.length > 0) {
    const ids = finalList.map((u) => u.id);
    const allowedUsers = await strapi.documents('api::brain-user.brain-user').findMany({
      fields: ['id'],
      filters: {
        id: { $in: ids },
        entity: {
          entity_type: { type: { $in: entityTypeNames } },
        },
      },
      limit: 100000,
    });
    const allowedIds = new Set(allowedUsers.map((u) => u.id));
    finalList = finalList.filter((u) => allowedIds.has(u.id));
  }

  return finalList;
}

module.exports = {
  resolveRecipientsByNotify,
};
