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
    {
      method: 'POST',
      path: '/entity/sync',
      handler: 'entity.sync',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
