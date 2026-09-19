'use strict';
const { sendDynamicTemplateEmail } = require('../../../../extensions/notifications/services/sendgrid');
const { alreadyHandled } = require('../../../../extensions/notifications/services/dedupe');

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    if (alreadyHandled(`interest:${result.documentId}`)) {
      strapi.log.info(`interest (${result.documentId}): evento duplicado (borrador/publicado), correo omitido.`);
      return;
    }

    try {
      const interest = await strapi.documents('api::interest.interest').findOne({
        documentId: result.documentId,
        populate: {
          opportunity: true,
          buyer: true,
          entity: true,
          brain_user: true,
        },
      });

      let entity_title = interest.name;
      if (interest.type === 'Opportunity Info' && interest.opportunity) {
        entity_title = interest.opportunity.title;
      } else if (interest.type === 'Buyer Info' && interest.buyer) {
        entity_title = interest.buyer.commercial_name;
      }

      const customArgs = {
        system: 'brain',
        entity_type: 'interest',
        entity_id: interest.documentId,
        entity_title,
      };

      await sendDynamicTemplateEmail({
        to: [
          'cbm@agexport.org.gt',
          'contactcbm@agexport.org.gt',
          'fernando.monzon@agexport.org.gt',
        ],
        templateId: process.env.SENDGRID_TEMPLATE_INTEREST,
        dynamicData: {
          name: interest.name,
          email: interest.email,
          phone: interest.phone,
          entity: interest.entity?.name || '',
          brain_user: interest.brain_user?.name || '',
          type: interest.type,
          opportunity: interest.opportunity?.title || '',
          buyer: interest.buyer?.commercial_name || '',
          comments: interest.comments || '',
          admin_link: `https://brain.agexport.org/admin/content-manager/collectionType/api::interest.interest/${interest.documentId}`,
        },
        customArgs,
      });

      strapi.log.info(`Email de interest enviado (${interest.documentId})`);

    } catch (error) {
      strapi.log.error('Error enviando email interest:', error);
    }
  },
};
