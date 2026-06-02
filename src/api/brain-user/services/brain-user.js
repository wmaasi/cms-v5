'use strict';

/**
 * brain-user service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::brain-user.brain-user');
