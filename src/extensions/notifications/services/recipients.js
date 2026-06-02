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
    },
  });

  if (!item) return [];

  const notifyKinds = (item.notify || []).map((n) => n.kind);
  if (!notifyKinds.length) return [];

  const sectorIds      = (item.sectors     || []).map((s) => s.id);
  const commissionIds  = (item.commissions || []).map((c) => c.id);
  const committeeIds   = (item.committees  || []).map((c) => c.id);
  const tagIds         = (item.tags        || []).map((t) => t.id);

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
  // Unificar y deduplicar
  // ======================================================
  const finalList = uniqUsers(finalBuckets.flat());
  return finalList;
}

module.exports = {
  resolveRecipientsByNotify,
};