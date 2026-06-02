'use strict';

const sgMail = require('@sendgrid/mail');

const apiKey = process.env.SENDGRID_API_KEY;

console.log("📧 SENDGRID FROM:", process.env.SENDGRID_FROM_EMAIL);
console.log("📧 TEMPLATE DOC:", process.env.SENDGRID_TEMPLATE_DOC);

if (!apiKey) {
  console.warn('SENDGRID_API_KEY no está definido en .env');
} else {
  sgMail.setApiKey(apiKey);
}

/**
 * Convierte Rich Text Blocks (Strapi) a HTML simple
 */
function blocksToHtml(blocks = []) {
  if (!Array.isArray(blocks)) return '';

  return blocks.map(block => {
    if (!block || !block.type) return '';

    // Párrafos
    if (block.type === 'paragraph') {
      const text = (block.children || [])
        .map(child => {
          let t = child.text || '';
          if (child.bold) t = `<strong>${t}</strong>`;
          if (child.italic) t = `<em>${t}</em>`;
          if (child.underline) t = `<u>${t}</u>`;
          return t;
        })
        .join('');

      return `<p>${text}</p>`;
    }

    // Encabezados
    if (block.type === 'heading') {
      const level = block.level || 2;
      const text = (block.children || []).map(c => c.text || '').join('');
      return `<h${level}>${text}</h${level}>`;
    }

    // Listas
    if (block.type === 'list') {
      const tag = block.format === 'ordered' ? 'ol' : 'ul';
      const items = (block.children || [])
        .map(item => {
          const text = (item.children || []).map(c => c.text || '').join('');
          return `<li>${text}</li>`;
        })
        .join('');
      return `<${tag}>${items}</${tag}>`;
    }

    return '';
  }).join('');
}

/**
 * Envía un correo usando una Dynamic Template de SendGrid.
 *
 * @param {Object} opts
 * @param {string} opts.to - Correo destinatario
 * @param {string} opts.templateId - ID de la plantilla dinámica (Doc o Tradeshow)
 * @param {Object} opts.dynamicData - Datos dinámicos para la plantilla
 */
async function sendDynamicTemplateEmail({ to, templateId, dynamicData, customArgs }) {
  if (!templateId) {
    console.warn('sendDynamicTemplateEmail: templateId no definido');
    return;
  }

  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME || 'Portal Brain',
    },
    templateId,
    dynamic_template_data: dynamicData || {},
    custom_args: customArgs || {},
  };

  try {
    await sgMail.send(msg);
  } catch (err) {
    // Usamos consola y strapi.log si está disponible
    console.error('Error enviando correo SendGrid:', err.message || err);
    if (global.strapi && strapi.log) {
      strapi.log.error('Error enviando correo SendGrid:', err);
    }
    throw err;
  }
}

module.exports = {
  sendDynamicTemplateEmail,
  blocksToHtml,
};
