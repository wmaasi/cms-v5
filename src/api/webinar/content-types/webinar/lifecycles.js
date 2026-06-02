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

    const webinar = await strapi.documents('api::webinar.webinar').findOne({
      documentId: result.documentId,
      populate: {
        tags: true,
        cover: true,
        countries: true,
      },
    });

    const templateId = process.env.SENDGRID_TEMPLATE_WEBINAR;
    const base = process.env.PUBLIC_SITE_URL;
    const formattedSlug = (webinar.slug || webinar.title || '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const url = `${base}/search/webinars/${webinar.documentId}_${formattedSlug}`;

    const imageUrl = webinar.cover?.url
      ? (webinar.cover.url.startsWith('http') ? webinar.cover.url : `${base}${webinar.cover.url}`)
      : `https://storage.googleapis.com/strapiv5_documents/placeholder_brain_91515cb43d/placeholder_brain_91515cb43d.jpg`;

    let descriptionHtml = '';
    if (Array.isArray(webinar.description)) {
      descriptionHtml = blocksToHtml(webinar.description);
    }
    if (!descriptionHtml) {
      descriptionHtml = '<p>Consulta la información de este webinar en Portal Brain.</p>';
    }

    let description_short = descriptionHtml.replace(/<[^>]*>?/gm, '').trim();
    if (description_short.length > 200) {
      description_short = description_short.substring(0, 200) + '...';
    }

    let tags_display = '';
    if (Array.isArray(webinar.tags)) {
      const names = webinar.tags.map(t => t.name);
      tags_display = names.length > 5
        ? names.slice(0, 5).join(', ') + ', otros...'
        : names.join(', ');
    }

    const countries = Array.isArray(webinar.countries)
      ? webinar.countries.map(c => c.name_sp || c.name).join(', ')
      : '';

    const location = webinar.organizer || '';

    const published_date = webinar.publishedAt
      ? new Date(webinar.publishedAt).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    const event_date = webinar.event_date
      ? new Date(webinar.event_date).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    const dynamicData = {
      title: webinar.title,
      imageUrl,
      url,
      description_short,
      location,
      countries,
      tags_display,
      published_date,
      event_date,
      speaker:    webinar.speaker    || '',
      signup_url: webinar.signup_url || '',
    };

    const customArgs = {
      system: 'brain',
      entity_type: 'webinar',
      entity_id: webinar.documentId,
      entity_title: webinar.title,
    };

    if ((mode === 'test' || mode === 'both') && testEmail) {
      try {
        await sendDynamicTemplateEmail({ to: testEmail, templateId, dynamicData, customArgs });
      } catch (err) {
        strapi.log.error('Error enviando email de prueba WEBINAR:', err);
      }
      if (mode === 'test') return;
    }

    if (mode === 'normal' || mode === 'both') {
      if (!Array.isArray(webinar.notify) || webinar.notify.length === 0) return;
      const users = await resolveRecipientsByNotify('api::webinar.webinar', webinar.documentId);
      if (!users.length) return;
      for (const user of users) {
        try {
          await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs });
        } catch (err) {
          strapi.log.error(`Error enviando WEBINAR a ${user.email}:`, err);
        }
      }
    }
  },
};