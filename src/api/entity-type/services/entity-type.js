'use strict';

/**
 * entity-type service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::entity-type.entity-type');
