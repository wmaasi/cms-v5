// src/api/company/services/getCachedToken.js
'use strict';

const axios = require('axios');
const qs = require('qs');

let cachedToken = null;
let cachedTokenExpiresAt = null;

module.exports = async () => {
  const now = Date.now();

  // Si el token aún es válido, devolverlo
  if (cachedToken && cachedTokenExpiresAt && now < cachedTokenExpiresAt) {
    return cachedToken;
  }

  strapi.log.info('[SYNC CRM] Solicitando nuevo token...');

  try {
    const response = await axios.post(
      'https://api.export.com.gt/prd/v1/api/crm-api/Token',
      qs.stringify({
        username: 'brain_crm@agexport.org.gt',
        password: 'Br@in2025?',
        grant_type: 'password',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    cachedToken = response.data.access_token;
    const expiresIn = response.data.expires_in || 1200; // segundos
    cachedTokenExpiresAt = now + expiresIn * 1000;

    strapi.log.info('[SYNC CRM] Nuevo token almacenado en caché');
    return cachedToken;
  } catch (err) {
    strapi.log.error('[SYNC CRM] Error al obtener token:');
    if (err.response) {
      strapi.log.error(err.response.status, err.response.data);
    } else {
      strapi.log.error(err.message);
    }
    throw new Error('No se pudo obtener el token');
  }
};
