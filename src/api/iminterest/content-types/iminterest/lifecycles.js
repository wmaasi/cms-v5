'use strict';
const { sendDynamicTemplateEmail } = require('../../../../extensions/notifications/services/sendgrid');

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    try {
      const iminterest = await strapi.documents('api::iminterest.iminterest').findOne({
        documentId: result.documentId,
        populate: {
          entity: true,
          brain_user: true,
          countries: true,
          codes: true,
          agexport_service: true,
        },
      });

      const notificationEmail = iminterest.agexport_service?.notificationEmail;
      if (!notificationEmail) {
        strapi.log.warn(`iminterest (${iminterest.documentId}): el servicio no tiene notificationEmail configurado.`);
        return;
      }

      const fullName = [iminterest.Nombre, iminterest.Apellido].filter(Boolean).join(' ');
      const countriesList = iminterest.countries?.map(c => c.name).join(', ') || '';
      const codesList     = iminterest.codes?.map(c => c.name).join(', ')    || '';

      const customArgs = {
        system: 'brain',
        entity_type: 'iminterest',
        entity_id: iminterest.documentId,
        entity_title: fullName,
      };

      await sendDynamicTemplateEmail({
        to: [notificationEmail],
        templateId: process.env.SENDGRID_TEMPLATE_IMINTEREST,
        dynamicData: {
          name:       iminterest.Nombre   || '',
          lastname:   iminterest.Apellido || '',
          full_name:  fullName,
          email:      iminterest.email    || '',
          phone:      iminterest.phone    || '',
          entity:     iminterest.entity?.name      || '',
          brain_user: iminterest.brain_user?.name  || '',
          service:    iminterest.agexport_service?.title || '',
          countries:  countriesList,
          codes:      codesList,
          message:    iminterest.message || '',
          admin_link: `https://brain.agexport.org/admin/content-manager/collectionType/api::iminterest.iminterest/${iminterest.documentId}`,
        },
        customArgs,
      });

      strapi.log.info(`Email de iminterest enviado (${iminterest.documentId}) → ${notificationEmail}`);

    } catch (error) {
      strapi.log.error('Error enviando email iminterest:', error);
    }
  },
};