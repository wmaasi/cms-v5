'use strict';

const path = require('path');
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::entity.entity', ({ strapi }) => ({
  async sync(ctx) {
    try {
      const secret = process.env.CRON_SECRET;
      const authHeader = ctx.request.headers.authorization;

      if (!authHeader || authHeader !== `Bearer ${secret}`) {
         strapi.log.warn('Intento no autorizado de ejecutar sync');
         return ctx.unauthorized('Unauthorized');
      }

      strapi.log.info('✅ Handler /entity/sync ejecutado');

      // 🔧 Carga manual del servicio
      const syncCrm = require(path.resolve(__dirname, '../services/sync-crm.js'));
      await syncCrm();

      ctx.send({ ok: true });
    } catch (err) {
      strapi.log.error('❌ Error en /entity/sync:', err);
      ctx.throw(500, 'Error al sincronizar');
    }
  },
}));
