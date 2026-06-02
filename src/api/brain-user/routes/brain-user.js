'use strict';

console.log('🧪 routes/brain-user.js se está cargando...');

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/brain-user/me',
      handler: 'brain-user.me',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::firebase-token'],
      },
    },
    {
      method: 'GET',
      path: '/brain-users',
      handler: 'brain-user.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/brain-users/:id',
      handler: 'brain-user.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PATCH',
      path: '/brain-users/:id',
      handler: 'brain-user.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/brain-users',
      handler: 'brain-user.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/brain-user',
      handler: 'brain-user.create',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::firebase-token'],
      },
    },
  ],
};
