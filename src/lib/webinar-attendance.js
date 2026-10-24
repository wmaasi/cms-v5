'use strict';

const crypto = require('node:crypto');
const zoom = require('./zoom');

const WEBINAR = 'api::webinar.webinar';
const REG = 'api::webinar-registration.webinar-registration';
const ATT = 'api::webinar-attendance.webinar-attendance';

const MIN = 60_000;
const HOUR = 60 * MIN;
const RECONCILE_AFTER = 30 * MIN;     // esperar a que Zoom genere el reporte
const RECONCILE_WINDOW = 7 * 24 * HOUR; // no intentar conciliar eventos más viejos

// --- Verificación de webhooks de Zoom ---

const hmac = (text) =>
  crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET || '').update(text).digest('hex');

function isAuthentic(headers, body) {
  const signature = headers['x-zm-signature'];
  const timestamp = headers['x-zm-request-timestamp'];
  if (!process.env.ZOOM_WEBHOOK_SECRET || !signature || !timestamp) return false;
  if (Math.abs(Date.now() - Number(timestamp) * 1000) > 5 * MIN) return false; // evita reenvíos viejos
  const expected = `v0=${hmac(`v0:${timestamp}:${JSON.stringify(body)}`)}`;
  return expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// --- Búsquedas ---

const findWebinarByZoomId = (zoomId) =>
  strapi.documents(WEBINAR).findFirst({
    status: 'published',
    filters: { provider: 'zoom', zoom_webinar_id: String(zoomId) },
  });

async function findRegistrationFor(webinar, { registrantId, email }) {
  if (registrantId) {
    const byId = await strapi.documents(REG).findFirst({ filters: { zoom_registrant_id: registrantId } });
    if (byId) return byId;
  }
  if (email) {
    return strapi.documents(REG).findFirst({
      filters: { webinar: { documentId: webinar.documentId }, brain_user: { email: { $eqi: email } } },
    });
  }
  return null;
}

const relations = (webinar, reg) => ({
  webinar: { connect: [{ documentId: webinar.documentId, status: 'published' }] },
  ...(reg ? { webinar_registration: { connect: [{ documentId: reg.documentId, status: 'published' }] } } : {}),
});

const seconds = (from, to) => Math.max(0, Math.round((new Date(to) - new Date(from)) / 1000));

// --- Webhook ---

async function handleWebhook(headers, body) {
  // Validación inicial de la URL que exige Zoom al configurar la suscripción
  if (body?.event === 'endpoint.url_validation') {
    const plainToken = body.payload?.plainToken;
    return { status: 200, body: { plainToken, encryptedToken: hmac(plainToken) } };
  }

  if (!isAuthentic(headers, body)) return { status: 401, body: { error: 'Firma inválida' } };

  const { event, payload } = body;
  const obj = payload?.object || {};
  const p = obj.participant || {};

  if (event !== 'webinar.participant_joined' && event !== 'webinar.participant_left') {
    return { status: 200, body: { ignored: event } };
  }

  // Cada ambiente (dev o producción) solo procesa sus propios webinars
  const webinar = await findWebinarByZoomId(obj.id);
  if (!webinar) return { status: 200, body: { ignored: 'webinar desconocido' } };

  const participantId = p.participant_uuid || p.id || p.user_id || '';

  if (event === 'webinar.participant_joined') {
    const reg = await findRegistrationFor(webinar, { registrantId: p.registrant_id, email: p.email });
    await strapi.documents(ATT).create({
      data: {
        ...relations(webinar, reg),
        participant_name: p.user_name || '',
        participant_email: p.email || '',
        zoom_participant_id: participantId,
        join_time: p.join_time,
        source: 'webhook',
      },
    });
    return { status: 200, body: { ok: true } };
  }

  // Salida: se completa la sesión abierta; si no existe (se perdió la entrada), se crea completa
  const open = await strapi.documents(ATT).findFirst({
    filters: {
      webinar: { documentId: webinar.documentId },
      zoom_participant_id: participantId,
      leave_time: { $null: true },
      source: 'webhook',
    },
    sort: 'join_time:desc',
  });

  if (open) {
    await strapi.documents(ATT).update({
      documentId: open.documentId,
      data: { leave_time: p.leave_time, duration_seconds: seconds(open.join_time, p.leave_time) },
    });
  } else {
    const reg = await findRegistrationFor(webinar, { registrantId: p.registrant_id, email: p.email });
    await strapi.documents(ATT).create({
      data: {
        ...relations(webinar, reg),
        participant_name: p.user_name || '',
        participant_email: p.email || '',
        zoom_participant_id: participantId,
        join_time: p.join_time || p.leave_time,
        leave_time: p.leave_time,
        duration_seconds: p.join_time ? seconds(p.join_time, p.leave_time) : 0,
        source: 'webhook',
      },
    });
  }
  return { status: 200, body: { ok: true } };
}

// --- Conciliación con el reporte de Zoom ---

async function reconcileWebinar(webinar) {
  const rows = await zoom.getWebinarParticipantsReport(webinar.zoom_webinar_id);
  if (!rows.length) return { webinar: webinar.title, participantes: 0 };

  const regs = await strapi.documents(REG).findMany({
    status: 'published',
    filters: {
      webinar: { documentId: webinar.documentId },
      registration_status: { $in: ['registered', 'attended', 'no_show'] },
    },
    populate: { brain_user: { fields: ['email'] } },
    limit: 1000,
  });
  const byRegistrant = new Map(regs.filter((r) => r.zoom_registrant_id).map((r) => [r.zoom_registrant_id, r]));
  const byEmail = new Map(regs.filter((r) => r.brain_user?.email).map((r) => [r.brain_user.email.toLowerCase(), r]));

  // El reporte reemplaza lo registrado por los webhooks
  const previous = await strapi.documents(ATT).findMany({
    filters: { webinar: { documentId: webinar.documentId } },
    fields: ['documentId'],
    limit: 5000,
  });
  for (const row of previous) await strapi.documents(ATT).delete({ documentId: row.documentId });

  const totals = new Map();
  for (const row of rows) {
    const reg = byRegistrant.get(row.registrant_id) || byEmail.get((row.user_email || '').toLowerCase()) || null;
    await strapi.documents(ATT).create({
      data: {
        ...relations(webinar, reg),
        participant_name: row.name || '',
        participant_email: row.user_email || '',
        zoom_participant_id: row.id || row.user_id || '',
        join_time: row.join_time,
        leave_time: row.leave_time,
        duration_seconds: row.duration || 0,
        source: 'report',
      },
    });
    if (reg) totals.set(reg.documentId, (totals.get(reg.documentId) || 0) + (row.duration || 0));
  }

  let attended = 0;
  for (const reg of regs) {
    const secs = totals.get(reg.documentId) || 0;
    if (secs >= 60) attended++;
    await strapi.documents(REG).update({
      documentId: reg.documentId,
      data: {
        attended_minutes: Math.round(secs / 60),
        registration_status: secs >= 60 ? 'attended' : 'no_show',
      },
    });
  }

  return { webinar: webinar.title, participantes: rows.length, inscritos: regs.length, asistieron: attended };
}

// Webinars que terminaron hace más de 30 minutos (y menos de 7 días) y aún no tienen datos del reporte
async function reconcileDue() {
  const now = Date.now();
  const webinars = await strapi.documents(WEBINAR).findMany({
    status: 'published',
    filters: {
      provider: 'zoom',
      zoom_webinar_id: { $notNull: true },
      event_status: 'scheduled',
      start_datetime: {
        $gte: new Date(now - RECONCILE_WINDOW - 24 * HOUR).toISOString(),
        $lte: new Date(now).toISOString(),
      },
    },
    limit: 200,
  });

  const results = [];
  for (const w of webinars) {
    const end = new Date(w.start_datetime).getTime() + (w.duration_minutes || 0) * MIN;
    if (now < end + RECONCILE_AFTER || now > end + RECONCILE_WINDOW) continue;

    const done = await strapi.documents(ATT).count({
      filters: { webinar: { documentId: w.documentId }, source: 'report' },
    });
    if (done) continue;

    try {
      results.push(await reconcileWebinar(w));
    } catch (err) {
      strapi.log.error(`[webinar-attendance] Conciliación de "${w.title}": ${err.message}`);
      results.push({ webinar: w.title, error: err.message });
    }
  }
  return results;
}

module.exports = { handleWebhook, reconcileDue, reconcileWebinar };
