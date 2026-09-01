'use strict';

/**
 * buyer-classification service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::buyer-classification.buyer-classification');
