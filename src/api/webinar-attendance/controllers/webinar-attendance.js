'use strict';

const { factories } = require('@strapi/strapi');
const attendance = require('../../../lib/webinar-attendance');

module.exports = factories.createCoreController('api::webinar-attendance.webinar-attendance', () => ({
  async zoomWebhook(ctx) {
    try {
      const result = await attendance.handleWebhook(ctx.request.headers, ctx.request.body);
      ctx.status = result.status;
      ctx.body = result.body;
    } catch (err) {
      strapi.log.error(`[zoom-webhook] ${err.message}`);
      ctx.status = 500; // Zoom reintenta
      ctx.body = { error: 'Error procesando el aviso' };
    }
  },
}));
