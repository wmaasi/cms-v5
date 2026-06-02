// src/api/entity/routes/entity-sync.js
'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/entity/sync',
      handler: 'entity.sync',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
