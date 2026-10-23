'use strict';

const crypto = require('node:crypto');

const API = 'https://api.zoom.us/v2';
const TIMEZONE = 'America/Guatemala';

const env = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`[zoom] Falta la variable de entorno ${key}`);
  return value;
};

class ZoomError extends Error {
  constructor(status, body) {
    super(body?.message || `Zoom respondió ${status}`);
    this.status = status;
    this.body = body;
  }
}

// --- Token Server-to-Server OAuth (dura 1 hora; se renueva 1 minuto antes) ---
let tokenCache = { token: null, expiresAt: 0 };

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token;
  const basic = Buffer.from(`${env('ZOOM_CLIENT_ID')}:${env('ZOOM_CLIENT_SECRET')}`).toString('base64');
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${env('ZOOM_ACCOUNT_ID')}`,
    { method: 'POST', headers: { Authorization: `Basic ${basic}` } },
  );
  const data = await res.json();
  if (!res.ok) throw new ZoomError(res.status, data);
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return tokenCache.token;
}

async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${API}${path}`);
  if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ZoomError(res.status, data);
  return data;
}

// --- Webinars ---

// Zoom ignora registrants_confirmation_email al crear; se aplica después y se verifica.
// Ajustes obligatorios en todos los webinars de Brain. Zoom ignora algunos al crear,
// así que se aplican con una actualización posterior y se verifican.
async function disableZoomEmails(webinarId) {
  const settings = {
    registrants_confirmation_email: false,
    registrants_email_notification: false,
    allow_multiple_devices: false, // cada inscrito entra desde un solo dispositivo
  };
  await request(`/webinars/${webinarId}`, { method: 'PATCH', body: { settings } });
  const w = await request(`/webinars/${webinarId}`);
  if (w.settings?.registrants_confirmation_email || w.settings?.registrants_email_notification) {
    throw new Error('[zoom] No se pudieron desactivar los correos de Zoom para este webinar');
  }
  if (w.settings?.allow_multiple_devices) {
    throw new Error('[zoom] No se pudo limitar el ingreso a un solo dispositivo en este webinar');
  }
}

async function createWebinar({ topic, agenda, startTime, durationMinutes }) {
  const w = await request(`/users/${encodeURIComponent(env('ZOOM_HOST_USER'))}/webinars`, {
    method: 'POST',
    body: {
      topic,
      agenda,
      type: 5,
      start_time: startTime,
      timezone: TIMEZONE,
      duration: durationMinutes,
      settings: {
        approval_type: 0,
        registration_type: 1,
        registrants_email_notification: false,
        registrants_confirmation_email: false,
        auto_recording: 'cloud',
        host_video: true,
        panelists_video: true,
      },
    },
  });
  await disableZoomEmails(w.id);
  return { id: String(w.id), password: w.password || '' };
}

async function updateWebinar(webinarId, { topic, agenda, startTime, durationMinutes }) {
  await request(`/webinars/${webinarId}`, {
    method: 'PATCH',
    body: { topic, agenda, start_time: startTime, timezone: TIMEZONE, duration: durationMinutes },
  });
  await disableZoomEmails(webinarId);
}

// Cancela sin que Zoom avise a los inscritos (Brain envía su propio correo).
async function cancelWebinar(webinarId) {
  await request(`/webinars/${webinarId}`, {
    method: 'DELETE',
    query: { cancel_webinar_reminder: false },
  });
}

// --- Inscritos ---

async function addRegistrant(webinarId, { email, firstName, lastName }) {
  const r = await request(`/webinars/${webinarId}/registrants`, {
    method: 'POST',
    body: { email, first_name: firstName, last_name: lastName || '' },
  });
  return {
    registrantId: r.registrant_id || r.id,
    joinToken: new URL(r.join_url).searchParams.get('tk'),
    joinUrl: r.join_url,
  };
}

// action: 'approve' (reactivar) o 'cancel'
async function setRegistrantStatus(webinarId, { registrantId, email }, action) {
  await request(`/webinars/${webinarId}/registrants/status`, {
    method: 'PUT',
    body: { action, registrants: [{ id: registrantId, email }] },
  });
}

// --- Firma del Meeting SDK (role 0 = asistente) ---

function sdkSignature(webinarId) {
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const sdkKey = env('ZOOM_SDK_KEY');
  const payload = { appKey: sdkKey, sdkKey, mn: String(webinarId), role: 0, iat, exp, tokenExp: exp };
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`;
  const sig = crypto.createHmac('sha256', env('ZOOM_SDK_SECRET')).update(unsigned).digest('base64url');
  return `${unsigned}.${sig}`;
}

module.exports = {
  ZoomError,
  createWebinar,
  updateWebinar,
  cancelWebinar,
  addRegistrant,
  setRegistrantStatus,
  sdkSignature,
  TIMEZONE,
};
