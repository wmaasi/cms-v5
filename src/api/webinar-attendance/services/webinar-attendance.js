'use strict';

/**
 * webinar-attendance service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::webinar-attendance.webinar-attendance');
