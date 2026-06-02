'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const isRelationEndpoint =
      ctx.method === 'GET' &&
      ctx.path.includes('/content-manager/relations/') &&
      ctx.path.endsWith('/sectors');

    if (isRelationEndpoint) {
      ctx.query = ctx.query || {};
      ctx.query.filters = {
        ...(ctx.query.filters || {}),
        source: { $eq: 'Agexport' },
      };
    }

    await next();
  };
};
