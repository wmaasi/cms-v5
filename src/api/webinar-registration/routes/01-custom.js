'use strict';

// Rutas de usuario: bajo /api/brain-user/... para que el middleware de Firebase las proteja.
const config = { auth: false, policies: [], middlewares: ['global::firebase-token'] };

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/brain-user/webinars/:documentId/registration',
      handler: 'webinar-registration.status',
      config,
    },
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
    // Recordatorios: la llama Cloud Scheduler con el encabezado X-Cron-Secret
    {
      method: 'POST',
      path: '/webinar-reminders/run',
      handler: 'webinar-registration.runReminders',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
