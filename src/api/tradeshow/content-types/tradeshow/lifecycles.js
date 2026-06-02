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

    const tradeshow = await strapi.documents('api::tradeshow.tradeshow').findOne({
      documentId: result.documentId,
      populate: {
        country: { fields: ['name_sp'] },
        tags: true,
        entity: true,
        cover: true,
      },
    });

    const templateId = process.env.SENDGRID_TEMPLATE_TRADE;
    const base = process.env.PUBLIC_SITE_URL;
    const formattedSlug = (tradeshow.slug || tradeshow.name || '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const url = `${base}/search/business/fairs-and-events/${tradeshow.documentId}_${formattedSlug}`;

    const imageUrl = tradeshow.cover?.url
      ? (tradeshow.cover.url.startsWith('http') ? tradeshow.cover.url : `${base}${tradeshow.cover.url}`)
      : `https://storage.googleapis.com/strapiv5_documents/placeholder_brain_91515cb43d/placeholder_brain_91515cb43d.jpg`;

    strapi.log.info(`PUBLIC_SITE_URL: ${process.env.PUBLIC_SITE_URL}`);
    strapi.log.info(`cover url: ${tradeshow.cover?.url}`);
    strapi.log.info(`imageUrl final: ${imageUrl}`);

    let descriptionHtml = '';
    if (tradeshow.summary) {
      descriptionHtml = tradeshow.summary;
    } else if (Array.isArray(tradeshow.description)) {
      descriptionHtml = blocksToHtml(tradeshow.description);
    }
    if (!descriptionHtml) {
      descriptionHtml = '<p>Consulta la información de este evento en Portal Brain.</p>';
    }

    let description_short = descriptionHtml.replace(/<[^>]*>?/gm, '').trim();
    if (description_short.length > 200) {
      description_short = description_short.substring(0, 200) + '...';
    }

    const countries = tradeshow.country?.name_sp || '';
    const location  = tradeshow.location || '';

    let tags_display = '';
    if (Array.isArray(tradeshow.tags)) {
      const names = tradeshow.tags.map(t => t.name);
      tags_display = names.length > 5
        ? names.slice(0, 5).join(', ') + ', otros...'
        : names.join(', ');
    }

    const published_date = tradeshow.publishedAt
      ? new Date(tradeshow.publishedAt).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    const dynamicData = {
      title: tradeshow.name,
      imageUrl,
      url,
      description_short,
      location,
      countries,
      tags_display,
      published_date,
      entityName: tradeshow.entity?.name || '',
    };

    const customArgs = {
      system: 'brain',
      entity_type: 'tradeshow',
      entity_id: tradeshow.documentId,
      entity_title: tradeshow.name,
    };

    if ((mode === 'test' || mode === 'both') && testEmail) {
      try {
        await sendDynamicTemplateEmail({ to: testEmail, templateId, dynamicData, customArgs });
      } catch (err) {
        strapi.log.error('Error enviando email de prueba Trade:', err);
      }
      if (mode === 'test') return;
    }

    if (mode === 'normal' || mode === 'both') {
      if (!Array.isArray(tradeshow.notify) || tradeshow.notify.length === 0) return;
      const users = await resolveRecipientsByNotify('api::tradeshow.tradeshow', tradeshow.documentId);
      if (!users.length) return;
      for (const user of users) {
        try {
          await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs });
        } catch (err) {
          strapi.log.error(`Error enviando TradeShow a ${user.email}:`, err);
        }
      }
    }
  },
};