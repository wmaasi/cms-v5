'use strict';

const { errors } = require('@strapi/utils');
const zoom = require('./zoom');
const emails = require('./webinar-emails');

const UID = 'api::webinar.webinar';

// Texto plano desde el campo "blocks" de Strapi (Zoom acepta máximo 2000 caracteres)
function blocksToText(blocks) {
  if (!Array.isArray(blocks)) return '';
  const walk = (node) => {
    if (typeof node?.text === 'string') return node.text;
    if (Array.isArray(node?.children)) return node.children.map(walk).join('');
    return '';
  };
  return blocks.map(walk).filter(Boolean).join('\n').slice(0, 2000);
}

// Fecha y hora locales de Guatemala, para llenar event_date y las horas existentes
function localParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zoom.TIMEZONE,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}.000`,
  };
}

const toZoomTime = (date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

async function syncBeforePublish(documentId) {
  const draft = await strapi.documents(UID).findOne({ documentId, status: 'draft' });
  if (!draft || draft.provider !== 'zoom') return; // los webinars externos no se tocan

  const published = await strapi.documents(UID).findOne({ documentId, status: 'published' });

  const missing = [];
  if (!draft.title) missing.push('título');
  if (!draft.start_datetime) missing.push('fecha y hora de inicio (start_datetime)');
  if (!draft.duration_minutes) missing.push('duración (duration_minutes)');
  if (missing.length) {
    throw new errors.ApplicationError(`Para publicar un webinar de Zoom falta: ${missing.join(', ')}.`);
  }

  const start = new Date(draft.start_datetime);
  const end = new Date(start.getTime() + draft.duration_minutes * 60_000);
  const zoomData = {
    topic: draft.title.slice(0, 200),
    agenda: blocksToText(draft.description),
    startTime: toZoomTime(start),
    durationMinutes: draft.duration_minutes,
  };

  let afterPublish = null; // correos que se envían cuando la publicación terminó bien

  const data = {};

  try {
    if (draft.event_status === 'cancelled') {
      if (draft.zoom_webinar_id && published?.event_status !== 'cancelled') {
        try {
          await zoom.cancelWebinar(draft.zoom_webinar_id);
        } catch (err) {
          if (err.status !== 404) throw err; // si ya no existe en Zoom, se da por cancelado
        }
        afterPublish = () => emails.sendEventCancelled({ ...draft, ...data });
      }
    } else if (!draft.zoom_webinar_id) {
      const created = await zoom.createWebinar(zoomData);
      data.zoom_webinar_id = created.id;
      data.zoom_passcode = created.password;
    } else {
      await zoom.updateWebinar(draft.zoom_webinar_id, zoomData);
      const previousStart = published?.start_datetime ? new Date(published.start_datetime).getTime() : null;
      if (previousStart && previousStart !== start.getTime()) {
        afterPublish = () => emails.sendScheduleChanged({ ...draft, ...data });
      }
    }
  } catch (err) {
    strapi.log.error('[webinar-sync]', err.body || err);
    await strapi.documents(UID).update({
      documentId,
      data: { zoom_sync_status: 'error', zoom_sync_error: String(err.message).slice(0, 2000) },
    });
    throw new errors.ApplicationError(`No se pudo sincronizar con Zoom: ${err.message}`);
  }

  const s = localParts(start);
  const e = localParts(end);
  Object.assign(data, {
    event_date: s.date,
    event_start_time: s.time,
    event_end_time: e.time,
    zoom_sync_status: 'synced',
    zoom_sync_error: null,
  });

  // Se guarda en el borrador; la publicación que sigue lo lleva a la versión publicada
  await strapi.documents(UID).update({ documentId, data });
  return afterPublish;
}

module.exports = { syncBeforePublish };
