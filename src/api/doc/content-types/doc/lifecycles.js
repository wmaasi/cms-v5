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

    const doc = await strapi.documents('api::doc.doc').findOne({
      documentId: result.documentId,
      populate: {
        countries: { fields: ['name_sp'] },
        tags: true,
        entity: true,
        cover: true,
      },
    });

    const templateId = process.env.SENDGRID_TEMPLATE_DOC;
    const base = process.env.PUBLIC_SITE_URL;
    const formattedSlug = (doc.slug || doc.title || '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const url = `${base}/search/intelligence/document/${doc.documentId}_${formattedSlug}`;

    const imageUrl = doc.cover?.url
      ? (doc.cover.url.startsWith('http') ? doc.cover.url : `${base}${doc.cover.url}`)
      : `https://storage.googleapis.com/strapiv5_documents/placeholder_brain_91515cb43d/placeholder_brain_91515cb43d.jpg`;

    let descriptionHtml = '';
    if (doc.summary) {
      descriptionHtml = doc.summary;
    } else if (Array.isArray(doc.desc)) {
      descriptionHtml = blocksToHtml(doc.desc);
    }
    if (!descriptionHtml) {
      descriptionHtml = '<p>Consulta el documento completo en Portal Brain.</p>';
    }

    let description_short = descriptionHtml.replace(/<[^>]*>?/gm, '').trim();
    if (description_short.length > 200) {
      description_short = description_short.substring(0, 200) + '...';
    }

    let countries = '';
    if (Array.isArray(doc.countries) && doc.countries.length > 0) {
      countries = doc.countries.map(t => t.name_sp).filter(Boolean).join(', ');
    }

    let tags_display = '';
    if (Array.isArray(doc.tags)) {
      const names = doc.tags.map(t => t.name);
      tags_display = names.length > 5
        ? names.slice(0, 5).join(', ') + ', otros...'
        : names.join(', ');
    }

    const published_date = doc.publishedAt
      ? new Date(doc.publishedAt).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    const dynamicData = {
      title: doc.title,
      imageUrl,
      url,
      description_short,
      countries,
      tags_display,
      published_date,
      entityName: doc.entity?.name || '',
    };

    const customArgs = {
      system: 'brain',
      entity_type: doc.type,
      entity_id: doc.documentId,
      entity_title: doc.title,
    };

    if ((mode === 'test' || mode === 'both') && testEmail) {
      try {
        await sendDynamicTemplateEmail({ to: testEmail, templateId, dynamicData, customArgs });
      } catch (err) {
        strapi.log.error('Error enviando email de prueba DOC:', err);
      }
      if (mode === 'test') return;
    }

    if (mode === 'normal' || mode === 'both') {
      if (!Array.isArray(doc.notify) || doc.notify.length === 0) return;
      const users = await resolveRecipientsByNotify('api::doc.doc', doc.documentId);
      if (!users.length) return;
      for (const user of users) {
        try {
          await sendDynamicTemplateEmail({ to: user.email, templateId, dynamicData, customArgs });
        } catch (err) {
          strapi.log.error(`Error enviando DOC a ${user.email}:`, err);
        }
      }
    }
  },
};