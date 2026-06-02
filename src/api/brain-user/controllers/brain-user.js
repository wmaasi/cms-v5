'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController(
  'api::brain-user.brain-user',
  ({ strapi }) => ({
    async create(ctx) {
      try {
        return await super.create(ctx);
      } catch (err) {
        strapi.log.error('❌ Error creando brain-user:', err);
        if (err.message === 'FIREBASE_EMAIL_EXISTS') {
          ctx.throw(400, 'El correo ya esta registrado', { firebaseCode: err.firebaseCode });
        }
        if (err.message?.startsWith('FIREBASE_')) {
          ctx.throw(500, 'Error creando usuario', { firebaseCode: err.firebaseCode });
        }
        throw err;
      }
    },
    async me(ctx) {
      strapi.log.info('🔍 ME ENDPOINT - status: published');
      const uid = ctx.state.firebaseUid;
      if (!uid) return ctx.unauthorized('No autorizado');

      const users = await strapi.documents('api::brain-user.brain-user').findMany({
        filters: { uid },
        status: 'published',
        populate: {
          entity: { populate: ['license'] },
          avatar: true,
          interest: true,
          countries: true,
          continents: true,
          regions: true,
          tags: true,
          codes: true,
          commissions: true,
          committees: true,
          subcommittees: true,
          sectors: true,
          notifications: true,
        },
        limit: 1,
      });

      if (!users || users.length === 0) return ctx.notFound('Usuario no encontrado');
      return this.transformResponse(users[0]);
    },
  })
);
