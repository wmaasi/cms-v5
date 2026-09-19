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
      strapi.log.info(`Notificación omitida (modo none): opportunity ${result.documentId}`);
      return;
    }

    const templateId = process.env.SENDGRID_TEMPLATE_OPPORTUNITY;

    const opportunity = await strapi.documents('api::opportunity.opportunity').findOne({
      documentId: result.documentId,
      populate: {
        notify: true,
        countries: { fields: ['name_sp'] },
        sectors: true,
        tags: { fields: ['name'] },
      },
    });

    const base = process.env.PUBLIC_SITE_URL;
    const formattedSlug = (opportunity.slug || opportunity.title || '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const url = `${base}/search/business/international-applications/${opportunity.documentId}_${formattedSlug}`;

    const publishedAt = opportunity.publishedAt
      ? new Date(opportunity.publishedAt).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    let description = '';
    if (Array.isArray(opportunity.description)) {
      description = blocksToHtml(opportunity.description);
    }
    if (!description) {
      description = '<p>Consulta los detalles de esta oportunidad en Portal Brain.</p>';
    }

    let countries = '';
    if (Array.isArray(opportunity.countries) && opportunity.countries.length > 0) {
      countries = opportunity.countries.map(t => t.name_sp).filter(Boolean).join(', ');
    }

    let tags_display = '';
    if (Array.isArray(opportunity.tags)) {
      const names = opportunity.tags.map(t => t.name);
      tags_display = names.length > 5
        ? names.slice(0, 5).join(', ') + ', otros...'
        : names.join(', ');
    }

    const dynamicData = {
      title: opportunity.title,
      publishedAt,
      description,
      countries,
      tags_display,
      url,
    };

    const customArgs = {
      system: 'brain',
      entity_type: 'opportunity',
      entity_id: opportunity.documentId,
      entity_title: opportunity.title,
    };

    if ((mode === 'test' || mode === 'both') && testEmail) {
      try {
        await sendDynamicTemplateEmail({ to: testEmail, templateId, dynamicData, customArgs });
        strapi.log.info(`Email de prueba OPPORTUNITY enviado (${result.documentId}) a ${testEmail}`);
      } catch (err) {
        strapi.log.error('Error enviando email de prueba para OPPORTUNITY:', err);
      }
      if (mode === 'test') return;
    }

    if (mode === 'normal' || mode === 'both') {
      if (!Array.isArray(opportunity.notify) || opportunity.notify.length === 0) {
        strapi.log.info(`Notificación omitida (opportunity ${result.documentId}): sin notify configurado`);
        return;
      }
      const users = await resolveRecipientsByNotify('api::opportunity.opportunity', opportunity.documentId);
      if (!users.length) {
        strapi.log.info(`Notificación omitida (opportunity ${result.documentId}): sin destinatarios`);
        return;
      }
      strapi.log.info(`Enviando notificación OPPORTUNITY (${result.documentId}) a ${users.length} usuarios`);
      for (const user of users) {
        try {
          await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs });
        } catch (err) {
          strapi.log.error(`Error enviando OPPORTUNITY a ${user.email}:`, err);
        }
      }
    }
  },
};