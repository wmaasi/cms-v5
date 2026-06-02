'use strict';

/**
 * Middleware de autenticación Firebase.
 * - Seguro si queda registrado globalmente: solo se aplica a /api/brain-user/**
 * - Permite preflight OPTIONS
 * - Bypass para rutas internas de Strapi
 * - (Opcional) Bypass con header X-Bypass-Firebase: 1
 */
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // 1) Preflight CORS
    if (ctx.method === 'OPTIONS') return next();

    // 2) Bypass explícito (integraciones server-to-server)
    if (ctx.get('X-Bypass-Firebase') === '1') return next();

    // 3) Rutas internas de Strapi que nunca deben autenticarse por Firebase
    const internalAllow = [
      /^\/$/,                           // health root
      /^\/admin(?:\/|$)/,
      /^\/content-manager(?:\/|$)/,
      /^\/content-type-builder(?:\/|$)/,
      /^\/i18n(?:\/|$)/,
      /^\/upload(?:\/|$)/,
      /^\/users-permissions(?:\/|$)/,
      /^\/graphql(?:\/|$)/,
    ];
    if (internalAllow.some((re) => re.test(ctx.path))) return next();

    // 4) Protección por prefijo (solo /api/brain-user/** si por error queda global)
    const protectedPrefix = /^\/api\/brain-user(?:\/|$)/;
    if (!protectedPrefix.test(ctx.path)) {
      // Si NO es una ruta protegida, dejar pasar
      return next();
    }

    // 5) Validación del token Firebase
    const authHeader = ctx.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized('Token no proporcionado');
    }

    if (!strapi.firebaseAdmin) {
      strapi.log.warn('[Firebase Middleware] firebaseAdmin no inicializado');
      return ctx.unauthorized('Auth no disponible');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    try {
      const decoded = await strapi.firebaseAdmin.auth().verifyIdToken(token);
      ctx.state.firebaseUid = decoded.uid;
      return next();
    } catch (err) {
      strapi.log.error('[Firebase Token Error]', err);
      return ctx.unauthorized('Token inválido');
    }
  };
};
