'use strict';

const axios = require('axios');
const getCachedToken = require('./getCachedToken');

module.exports = async () => {
  try {
    strapi.log.info('[SYNC CRM] Ejecutando sincronización con CRM...');

    const token = await getCachedToken();
    if (!token) {
      throw new Error('No se pudo obtener el token');
    }

    strapi.log.info('[SYNC CRM] Token obtenido correctamente');

    const url = 'https://api.export.com.gt/prd/v1/api/crm-api/api/AgexportPlus/Empresas?pTipo=Socios';
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 15000
    });

    const empresas = response.data?.data || [];
    strapi.log.info(`[SYNC CRM] Se recibieron ${empresas.length} empresas del CRM`);

    for (const empresa of empresas) {
      const name = empresa.NombreComercial || empresa.RazonSocial || 'SIN NOMBRE';
      strapi.log.info(`[SYNC CRM] Procesando empresa: ${name}`);

      const existing = await strapi.db.query('api::company.company').findOne({
        where: { nit: empresa.Nit }
      });

      const data = {
        name,
        legal_name: empresa.RazonSocial || null,
        associated: empresa.Asociado === 'Sí',
        exporter: empresa.dataXport ? 'Sí' : 'No',
        nit: empresa.Nit || null,
        address: empresa.Direccion || null,
        active: true,
        email: empresa.EmailEmpresarial || null,
        phone: empresa.TelefonoGeneral || null
      };

      if (existing) {
        await strapi.db.query('api::company.company').update({
          where: { id: existing.id },
          data
        });
      } else {
        await strapi.db.query('api::company.company').create({ data });
      }
    }

    strapi.log.info('[SYNC CRM] Sincronización finalizada correctamente ✅');

  } catch (err) {
    strapi.log.error('[SYNC CRM] Error general:');
    strapi.log.error(err.message || err);
    throw err;
  }
};
