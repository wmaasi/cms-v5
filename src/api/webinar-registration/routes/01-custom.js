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
    // Tareas programadas (recordatorios y conciliación de asistencia). La llama Cloud Scheduler.
    {
      method: 'POST',
      path: '/webinar-jobs/run',
      handler: 'webinar-registration.runJobs',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
