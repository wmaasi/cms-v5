'use strict';

const admin = require('firebase-admin');
const serviceAccount = require('./extensions/user-permissions/firebase-service-account.json');
const { sendDynamicTemplateEmail, blocksToHtml } = require('./extensions/notifications/services/sendgrid');
const { resolveRecipientsByNotify } = require('./extensions/notifications/services/recipients');

console.log('🧪 index.js cargado');

// ─────────────────────────────────────────────────────────
// Helpers compartidos
// ─────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatSlug(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function formatTags(tags, limit = 5) {
  if (!Array.isArray(tags)) return '';
  const names = tags.map(t => t.name).filter(Boolean);
  return names.length > limit
    ? names.slice(0, limit).join(', ') + ', otros...'
    : names.join(', ');
}

// ─────────────────────────────────────────────────────────
// Handlers de notificación por content type
// ─────────────────────────────────────────────────────────

async function notifyBuyer(documentId) {
  const buyer = await strapi.documents('api::buyer.buyer').findOne({
    documentId,
    populate: { countries: true, sectors: true, tags: true, notify: true },
  });
  if (!buyer) return;

  const mode = buyer.notificationMode || 'normal';
  if (mode === 'none') return;

  const base = process.env.PUBLIC_SITE_URL;
  const slug = formatSlug(buyer.slug || buyer.commercial_name);
  const url = `${base}/search/business/international-buyers/${buyer.documentId}_${slug}`;

  const dynamicData = {
    title: buyer.commercial_name || buyer.legal_name || 'Nuevo Buyer',
    url,
    publishedAt: formatDate(buyer.publishedAt),
    countries: Array.isArray(buyer.countries) ? buyer.countries.map(c => c.name_sp || c.name).join(', ') : '',
    sectors: Array.isArray(buyer.sectors) ? buyer.sectors.map(s => s.name).join(', ') : '',
    tags: formatTags(buyer.tags),
  };

  const customArgs = { system: 'brain', entity_type: 'buyer', entity_id: buyer.documentId, entity_title: buyer.commercial_name };
  const templateId = process.env.SENDGRID_TEMPLATE_BUYER;

  if ((mode === 'test' || mode === 'both') && buyer.notificationTestEmail) {
    await sendDynamicTemplateEmail({ to: buyer.notificationTestEmail, templateId, dynamicData, customArgs }).catch(err => strapi.log.error('BUYER test email error:', err));
    if (mode === 'test') return;
  }

  if (mode === 'normal' || mode === 'both') {
    if (!Array.isArray(buyer.notify) || !buyer.notify.length) return;
    const users = await resolveRecipientsByNotify('api::buyer.buyer', documentId);
    for (const user of users) {
      await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs }).catch(err => strapi.log.error(`BUYER email error to ${user.email}:`, err));
    }
  }
}

async function notifyDoc(documentId) {
  const doc = await strapi.documents('api::doc.doc').findOne({
    documentId,
    populate: { countries: { fields: ['name_sp'] }, tags: true, cover: true, notify: true },
  });
  if (!doc) return;

  const mode = doc.notificationMode || 'normal';
  if (mode === 'none') return;

  const base = process.env.PUBLIC_SITE_URL;
  const slug = formatSlug(doc.slug || doc.title);
  const url = `${base}/search/intelligence/document/${doc.documentId}_${slug}`;

  const imageUrl = doc.cover?.url
    ? (doc.cover.url.startsWith('http') ? doc.cover.url : `${base}${doc.cover.url}`)
    : `https://storage.googleapis.com/strapiv5_documents/placeholder_brain_91515cb43d/placeholder_brain_91515cb43d.jpg`;

  let descriptionHtml = doc.summary || (Array.isArray(doc.desc) ? blocksToHtml(doc.desc) : '') || '<p>Consulta el documento completo en Portal Brain.</p>';
  let description_short = descriptionHtml.replace(/<[^>]*>?/gm, '').trim();
  if (description_short.length > 200) description_short = description_short.substring(0, 200) + '...';

  const dynamicData = {
    title: doc.title,
    imageUrl,
    url,
    description_short,
    countries: Array.isArray(doc.countries) ? doc.countries.map(t => t.name_sp).filter(Boolean).join(', ') : '',
    tags_display: formatTags(doc.tags),
    published_date: formatDate(doc.publishedAt),
    entityName: '',
  };

  const customArgs = { system: 'brain', entity_type: doc.type, entity_id: doc.documentId, entity_title: doc.title };
  const templateId = process.env.SENDGRID_TEMPLATE_DOC;

  if ((mode === 'test' || mode === 'both') && doc.notificationTestEmail) {
    await sendDynamicTemplateEmail({ to: doc.notificationTestEmail, templateId, dynamicData, customArgs }).catch(err => strapi.log.error('DOC test email error:', err));
    if (mode === 'test') return;
  }

  if (mode === 'normal' || mode === 'both') {
    if (!Array.isArray(doc.notify) || !doc.notify.length) return;
    const users = await resolveRecipientsByNotify('api::doc.doc', documentId);
    for (const user of users) {
      await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs }).catch(err => strapi.log.error(`DOC email error to ${user.email}:`, err));
    }
  }
}

async function notifyTradeshow(documentId) {
  const tradeshow = await strapi.documents('api::tradeshow.tradeshow').findOne({
    documentId,
    populate: { country: { fields: ['name_sp'] }, tags: true, entity: true, cover: true, notify: true },
  });
  if (!tradeshow) return;

  const mode = tradeshow.notificationMode || 'normal';
  if (mode === 'none') return;

  const base = process.env.PUBLIC_SITE_URL;
  const slug = formatSlug(tradeshow.slug || tradeshow.name);
  const url = `${base}/search/business/fairs-and-events/${tradeshow.documentId}_${slug}`;

  const imageUrl = tradeshow.cover?.url
    ? (tradeshow.cover.url.startsWith('http') ? tradeshow.cover.url : `${base}${tradeshow.cover.url}`)
    : `https://storage.googleapis.com/strapiv5_documents/placeholder_brain_91515cb43d/placeholder_brain_91515cb43d.jpg`;

  let descriptionHtml = tradeshow.summary || (Array.isArray(tradeshow.description) ? blocksToHtml(tradeshow.description) : '') || '<p>Consulta la información de este evento en Portal Brain.</p>';
  let description_short = descriptionHtml.replace(/<[^>]*>?/gm, '').trim();
  if (description_short.length > 200) description_short = description_short.substring(0, 200) + '...';

  const dynamicData = {
    title: tradeshow.name,
    imageUrl,
    url,
    description_short,
    location: tradeshow.location || '',
    countries: tradeshow.country?.name_sp || '',
    tags_display: formatTags(tradeshow.tags),
    published_date: formatDate(tradeshow.publishedAt),
    entityName: tradeshow.entity?.name || '',
  };

  const customArgs = { system: 'brain', entity_type: 'tradeshow', entity_id: tradeshow.documentId, entity_title: tradeshow.name };
  const templateId = process.env.SENDGRID_TEMPLATE_TRADE;

  if ((mode === 'test' || mode === 'both') && tradeshow.notificationTestEmail) {
    await sendDynamicTemplateEmail({ to: tradeshow.notificationTestEmail, templateId, dynamicData, customArgs }).catch(err => strapi.log.error('TRADESHOW test email error:', err));
    if (mode === 'test') return;
  }

  if (mode === 'normal' || mode === 'both') {
    if (!Array.isArray(tradeshow.notify) || !tradeshow.notify.length) return;
    const users = await resolveRecipientsByNotify('api::tradeshow.tradeshow', documentId);
    for (const user of users) {
      await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs }).catch(err => strapi.log.error(`TRADESHOW email error to ${user.email}:`, err));
    }
  }
}

async function notifyWebinar(documentId) {
  const webinar = await strapi.documents('api::webinar.webinar').findOne({
    documentId,
    populate: { tags: true, cover: true, countries: true, notify: true },
  });
  if (!webinar) return;

  const mode = webinar.notificationMode || 'normal';
  if (mode === 'none') return;

  const base = process.env.PUBLIC_SITE_URL;
  const slug = formatSlug(webinar.slug || webinar.title);
  const url = `${base}/search/webinars/${webinar.documentId}_${slug}`;

  const imageUrl = webinar.cover?.url
    ? (webinar.cover.url.startsWith('http') ? webinar.cover.url : `${base}${webinar.cover.url}`)
    : `https://storage.googleapis.com/strapiv5_documents/placeholder_brain_91515cb43d/placeholder_brain_91515cb43d.jpg`;

  let descriptionHtml = (Array.isArray(webinar.description) ? blocksToHtml(webinar.description) : '') || '<p>Consulta la información de este webinar en Portal Brain.</p>';
  let description_short = descriptionHtml.replace(/<[^>]*>?/gm, '').trim();
  if (description_short.length > 200) description_short = description_short.substring(0, 200) + '...';

  const dynamicData = {
    title: webinar.title,
    imageUrl,
    url,
    description_short,
    location: webinar.organizer || '',
    countries: Array.isArray(webinar.countries) ? webinar.countries.map(c => c.name_sp || c.name).join(', ') : '',
    tags_display: formatTags(webinar.tags),
    published_date: formatDate(webinar.publishedAt),
    event_date: formatDate(webinar.event_date),
    speaker: webinar.speaker || '',
    signup_url: webinar.signup_url || '',
  };

  const customArgs = { system: 'brain', entity_type: 'webinar', entity_id: webinar.documentId, entity_title: webinar.title };
  const templateId = process.env.SENDGRID_TEMPLATE_WEBINAR;

  if ((mode === 'test' || mode === 'both') && webinar.notificationTestEmail) {
    await sendDynamicTemplateEmail({ to: webinar.notificationTestEmail, templateId, dynamicData, customArgs }).catch(err => strapi.log.error('WEBINAR test email error:', err));
    if (mode === 'test') return;
  }

  if (mode === 'normal' || mode === 'both') {
    if (!Array.isArray(webinar.notify) || !webinar.notify.length) return;
    const users = await resolveRecipientsByNotify('api::webinar.webinar', documentId);
    for (const user of users) {
      await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs }).catch(err => strapi.log.error(`WEBINAR email error to ${user.email}:`, err));
    }
  }
}

async function notifyOpportunity(documentId) {
  const opportunity = await strapi.documents('api::opportunity.opportunity').findOne({
    documentId,
    populate: { countries: { fields: ['name_sp'] }, tags: { fields: ['name'] }, notify: true },
  });
  if (!opportunity) return;

  const mode = opportunity.notificationMode || 'normal';
  if (mode === 'none') return;

  const base = process.env.PUBLIC_SITE_URL;
  const slug = formatSlug(opportunity.slug || opportunity.title);
  const url = `${base}/search/business/international-applications/${opportunity.documentId}_${slug}`;

  let description = (Array.isArray(opportunity.description) ? blocksToHtml(opportunity.description) : '') || '<p>Consulta los detalles de esta oportunidad en Portal Brain.</p>';

  const dynamicData = {
    title: opportunity.title,
    publishedAt: formatDate(opportunity.publishedAt),
    description,
    countries: Array.isArray(opportunity.countries) ? opportunity.countries.map(t => t.name_sp).filter(Boolean).join(', ') : '',
    tags_display: formatTags(opportunity.tags),
    url,
  };

  const customArgs = { system: 'brain', entity_type: 'opportunity', entity_id: opportunity.documentId, entity_title: opportunity.title };
  const templateId = process.env.SENDGRID_TEMPLATE_OPPORTUNITY;

  if ((mode === 'test' || mode === 'both') && opportunity.notificationTestEmail) {
    await sendDynamicTemplateEmail({ to: opportunity.notificationTestEmail, templateId, dynamicData, customArgs }).catch(err => strapi.log.error('OPPORTUNITY test email error:', err));
    if (mode === 'test') return;
  }

  if (mode === 'normal' || mode === 'both') {
    if (!Array.isArray(opportunity.notify) || !opportunity.notify.length) return;
    const users = await resolveRecipientsByNotify('api::opportunity.opportunity', documentId);
    for (const user of users) {
      await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs }).catch(err => strapi.log.error(`OPPORTUNITY email error to ${user.email}:`, err));
    }
  }
}

async function notifyStatistic(documentId) {
  const statistic = await strapi.documents('api::statistic.statistic').findOne({
    documentId,
    populate: { countries: true, tags: true, cover: true, notify: true },
  });
  if (!statistic) return;

  const mode = statistic.notificationMode || 'normal';
  if (mode === 'none') return;

  const base = process.env.PUBLIC_SITE_URL;
  const slug = formatSlug(statistic.slug || statistic.title);
  const url = `${base}/search/present/estadisticas/${statistic.documentId}_${slug}`;

  const imageUrl = statistic.cover?.url
    ? (statistic.cover.url.startsWith('http') ? statistic.cover.url : `${base}${statistic.cover.url}`)
    : `https://storage.googleapis.com/strapiv5_documents/placeholder_brain_91515cb43d/placeholder_brain_91515cb43d.jpg`;

  let descriptionHtml = (Array.isArray(statistic.desc) ? blocksToHtml(statistic.desc) : '') || '<p>Consulta esta estadística en Portal Brain.</p>';
  let description_short = descriptionHtml.replace(/<[^>]*>?/gm, '').trim();
  if (description_short.length > 200) description_short = description_short.substring(0, 200) + '...';

  const dynamicData = {
    title: statistic.title,
    imageUrl,
    url,
    description_short,
    countries: Array.isArray(statistic.countries) ? statistic.countries.map(t => t.name_sp).filter(Boolean).join(', ') : '',
    tags_display: formatTags(statistic.tags),
    published_date: formatDate(statistic.publishedAt),
  };

  const customArgs = { system: 'brain', entity_type: 'statistics', entity_id: statistic.documentId, entity_title: statistic.title };
  const templateId = process.env.SENDGRID_TEMPLATE_STATISTICS;

  if ((mode === 'test' || mode === 'both') && statistic.notificationTestEmail) {
    await sendDynamicTemplateEmail({ to: statistic.notificationTestEmail, templateId, dynamicData, customArgs }).catch(err => strapi.log.error('STATISTIC test email error:', err));
    if (mode === 'test') return;
  }

  if (mode === 'normal' || mode === 'both') {
    if (!Array.isArray(statistic.notify) || !statistic.notify.length) return;
    const users = await resolveRecipientsByNotify('api::statistic.statistic', documentId);
    for (const user of users) {
      await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs }).catch(err => strapi.log.error(`STATISTIC email error to ${user.email}:`, err));
    }
  }
}

// ─────────────────────────────────────────────────────────
// Mapa de content types → handlers de notificación
// ─────────────────────────────────────────────────────────
const NOTIFICATION_HANDLERS = {
  'api::buyer.buyer':           notifyBuyer,
  'api::doc.doc':               notifyDoc,
  'api::tradeshow.tradeshow':   notifyTradeshow,
  'api::webinar.webinar':       notifyWebinar,
  'api::opportunity.opportunity': notifyOpportunity,
  'api::statistic.statistic':   notifyStatistic,
};

// ─────────────────────────────────────────────────────────
// Export principal
// ─────────────────────────────────────────────────────────
module.exports = {
  async register({ strapi }) {
    console.log('🧪 register ejecutado');

    // 1) Inicializar Firebase Admin
    if (!admin.apps.length) {
      const firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      strapi.firebaseAdmin = firebaseApp;
      strapi.log.info('✅ Firebase Admin inicializado correctamente');
    }

    // 2) Document Service Middleware para notificaciones al publicar
    strapi.documents.use(async (context, next) => {
      const result = await next();

      if (context.action === 'publish') {
        const uid = context.contentType?.uid;
        const documentId = context.params?.documentId;

        const handler = NOTIFICATION_HANDLERS[uid];
        if (handler && documentId) {
          strapi.log.info(`📧 Disparando notificación para ${uid} (${documentId})`);
          // Diferir fuera de la transacción actual
          setImmediate(() => {
            handler(documentId).catch(err =>
              strapi.log.error(`Error en notificación ${uid}:`, err)
            );
          });
        }
      }

      return result;
    });
  },

  async bootstrap({ strapi }) {
    console.log('🧪 bootstrap ejecutado');
  },
};