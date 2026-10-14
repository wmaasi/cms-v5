'use strict';

// Todas bajo /api/brain-user/... para que el middleware de Firebase las proteja.
const config = { auth: false, policies: [], middlewares: ['global::firebase-token'] };

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/brain-user/webinars/:documentId/register',
      handler: 'webinar-registration.register',
      config,
    },
    {
      method: 'DELETE',
      path: '/brain-user/webinars/:documentId/register',
      handler: 'webinar-registration.cancel',
      config,
    },
    {
      method: 'POST',
      path: '/brain-user/webinars/:documentId/join',
      handler: 'webinar-registration.join',
      config,
    },
  ],
};
