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
    if (mode === 'none') {
      strapi.log.info(`Notificación omitida (modo none): statistic ${result.documentId}`);
      return;
    }

    const statistic = await strapi.documents('api::statistic.statistic').findOne({
      documentId: result.documentId,
      populate: {
        notify: true,
        countries: true,
        tags: true,
        cover: true,
      },
    });

    const templateId = process.env.SENDGRID_TEMPLATE_STATISTICS;
    const base = process.env.PUBLIC_SITE_URL;
    const formattedSlug = (statistic.slug || statistic.title || '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const url = `${base}/search/present/estadisticas/${statistic.documentId}_${formattedSlug}`;

    const imageUrl = statistic.cover?.url
      ? (statistic.cover.url.startsWith('http') ? statistic.cover.url : `${base}${statistic.cover.url}`)
      : `https://storage.googleapis.com/strapiv5_documents/placeholder_brain_91515cb43d/placeholder_brain_91515cb43d.jpg`;

    let descriptionHtml = '';
    if (Array.isArray(statistic.desc)) {
      descriptionHtml = blocksToHtml(statistic.desc);
    }
    if (!descriptionHtml) {
      descriptionHtml = '<p>Consulta esta estadística en Portal Brain.</p>';
    }

    let description_short = descriptionHtml.replace(/<[^>]*>?/gm, '').trim();
    if (description_short.length > 200) {
      description_short = description_short.substring(0, 200) + '...';
    }

    let countries = '';
    if (Array.isArray(statistic.countries) && statistic.countries.length > 0) {
      countries = statistic.countries.map(t => t.name_sp).filter(Boolean).join(', ');
    }

    let tags_display = '';
    if (Array.isArray(statistic.tags)) {
      const names = statistic.tags.map(t => t.name);
      tags_display = names.length > 5
        ? names.slice(0, 5).join(', ') + ', otros...'
        : names.join(', ');
    }

    const published_date = statistic.publishedAt
      ? new Date(statistic.publishedAt).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    const dynamicData = {
      title: statistic.title,
      imageUrl,
      url,
      description_short,
      countries,
      tags_display,
      published_date,
    };

    const customArgs = {
      system: 'brain',
      entity_type: 'statistics',
      entity_id: statistic.documentId,
      entity_title: statistic.title,
    };

    if ((mode === 'test' || mode === 'both') && testEmail) {
      try {
        await sendDynamicTemplateEmail({ to: testEmail, templateId, dynamicData, customArgs });
        strapi.log.info(`Email de prueba STATISTIC enviado (${result.documentId}) a ${testEmail}`);
      } catch (err) {
        strapi.log.error('Error enviando email de prueba STATISTICS:', err);
      }
      if (mode === 'test') return;
    }

    if (mode === 'normal' || mode === 'both') {
      if ([].concat(statistic.notify || []).length === 0) {
        strapi.log.info(`Notificación omitida (statistic ${result.documentId}): sin notify configurado`);
        return;
      }
      const users = await resolveRecipientsByNotify('api::statistic.statistic', statistic.documentId);
      if (!users.length) {
        strapi.log.info(`Notificación omitida (statistic ${result.documentId}): sin destinatarios`);
        return;
      }
      strapi.log.info(`Enviando notificación STATISTIC (${result.documentId}) a ${users.length} usuarios`);
      for (const user of users) {
        try {
          await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs });
        } catch (err) {
          strapi.log.error(`Error enviando STATISTICS a ${user.email}:`, err);
        }
      }
    }
  },
};