'use strict';
const { resolveRecipientsByNotify } = require('../../../../extensions/notifications/services/recipients');
const { sendDynamicTemplateEmail, blocksToHtml } = require('../../../../extensions/notifications/services/sendgrid');

module.exports = {
  async afterUpdate(event) {
    const { result, params } = event;

    const publishedNow =
      params?.data?.hasOwnProperty('publishedAt') &&
      !!result.publishedAt;
    if (!publishedNow) return;

    const mode = result.notificationMode || 'normal';
    const testEmail = result.notificationTestEmail;
    if (mode === 'none') return;

    const templateId = process.env.SENDGRID_TEMPLATE_BUYER;

    const buyer = await strapi.documents('api::buyer.buyer').findOne({
      documentId: result.documentId,
      populate: {
        countries: true,
        sectors: true,
        tags: true,
      },
    });

    const base = process.env.PUBLIC_SITE_URL;
    const formattedSlug = (buyer.slug || buyer.commercial_name || '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const countries = Array.isArray(buyer.countries)
      ? buyer.countries.map(c => c.name_sp || c.name).join(', ')
      : '';

    const sectors = Array.isArray(buyer.sectors)
      ? buyer.sectors.map(s => s.name).join(', ')
      : '';

    const tags = Array.isArray(buyer.tags)
      ? buyer.tags.map(t => t.name).join(', ')
      : '';

    const publishedAt = buyer.publishedAt
      ? new Date(buyer.publishedAt).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    const url = `${base}/search/business/international-buyers/${buyer.documentId}_${formattedSlug}`;

    let descriptionHtml = '';
    if (Array.isArray(buyer.description)) {
      descriptionHtml = blocksToHtml(buyer.description);
    }

    const dynamicData = {
      title: buyer.commercial_name || buyer.legal_name || 'Nuevo Buyer',
      url, publishedAt, countries, sectors, tags,
    };

    const customArgs = {
      system: 'brain',
      entity_type: 'buyer',
      entity_id: buyer.documentId,
      entity_title: buyer.commercial_name,
    };

    if ((mode === 'test' || mode === 'both') && testEmail) {
      try {
        await sendDynamicTemplateEmail({ to: testEmail, templateId, dynamicData, customArgs });
      } catch (err) {
        strapi.log.error('Error enviando email de prueba para BUYER:', err);
      }
      if (mode === 'test') return;
    }

    if (mode === 'normal' || mode === 'both') {
      if (!Array.isArray(buyer.notify) || buyer.notify.length === 0) return;
      const users = await resolveRecipientsByNotify('api::buyer.buyer', buyer.documentId);
      if (!users.length) return;
      for (const user of users) {
        try {
          await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs });
        } catch (err) {
          strapi.log.error(`Error enviando BUYER a ${user.email}:`, err);
        }
      }
    }
  },
};