'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/zoom/webhook',
      handler: 'webinar-attendance.zoomWebhook',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
