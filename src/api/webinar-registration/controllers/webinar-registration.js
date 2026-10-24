'use strict';

const { factories } = require('@strapi/strapi');
const { errors } = require('@strapi/utils');
const zoom = require('../../../lib/zoom');
const emails = require('../../../lib/webinar-emails');
const attendance = require('../../../lib/webinar-attendance');

const REG = 'api::webinar-registration.webinar-registration';
const WEBINAR = 'api::webinar.webinar';
const USER = 'api::brain-user.brain-user';

const JOIN_BEFORE_MIN = 30; // la sala abre 30 min antes
const JOIN_AFTER_MIN = 30;  // y cierra 30 min después del final programado
const PENDING_STALE_MS = 2 * 60_000; // una inscripción "pending" de más de 2 min se considera abandonada

const ACTIVE = ['registered', 'attended'];

// --- Helpers ---

async function getUser(ctx) {
  const uid = ctx.state.firebaseUid;
  // Rechaza también peticiones que usaron el bypass del middleware
  if (!uid) throw new errors.UnauthorizedError('Debes iniciar sesión');
  const user = await strapi.documents(USER).findFirst({ filters: { uid }, status: 'published' });
  if (!user || user.active === false) throw new errors.ForbiddenError('Usuario no habilitado');
  return user;
}

async function getWebinar(documentId) {
  const w = await strapi.documents(WEBINAR).findOne({ documentId, status: 'published' });
  if (!w || w.provider !== 'zoom' || !w.zoom_webinar_id) {
    throw new errors.NotFoundError('Webinar no encontrado');
  }
  const start = new Date(w.start_datetime);
  const end = new Date(start.getTime() + (w.duration_minutes || 0) * 60_000);
  return { ...w, start, end };
}

const findRegistration = (webinar, user) =>
  strapi.documents(REG).findFirst({
    filters: {
      webinar: { documentId: webinar.documentId },
      brain_user: { documentId: user.documentId },
    },
  });

const isStalePending = (reg) =>
  reg.registration_status === 'pending' &&
  Date.now() - new Date(reg.updatedAt).getTime() > PENDING_STALE_MS;

// Correo de confirmación fuera de la petición: un fallo de correo no afecta la inscripción
function queueConfirmation(webinar, user, regDocumentId) {
  setImmediate(async () => {
    try {
      await emails.sendRegistrationConfirmed(webinar, user);
      await strapi.documents(REG).update({
        documentId: regDocumentId,
        data: { confirmation_sent_at: new Date().toISOString() },
      });
    } catch (err) {
      strapi.log.error(`[webinar-emails] Confirmación a ${user.email}: ${err.message}`);
    }
  });
}

// Evita que dos peticiones simultáneas del mismo usuario al mismo webinar
// lleguen a Zoom: la segunda espera y recibe el resultado de la primera.
const inFlight = new Map();

function ensureRegistration(webinar, user, source) {
  const key = `${webinar.documentId}:${user.documentId}`;
  if (inFlight.has(key)) return inFlight.get(key);
  const task = doEnsureRegistration(webinar, user, source).finally(() => inFlight.delete(key));
  inFlight.set(key, task);
  return task;
}

// Orden: primero se reserva en Strapi ("pending"), luego Zoom.
// Si Zoom falla, se deshace la reserva; así nunca queda un inscrito en Zoom sin registro en Brain.
async function doEnsureRegistration(webinar, user, source) {
  let existing = await findRegistration(webinar, user);
  if (existing && ACTIVE.includes(existing.registration_status)) return existing;

  if (existing && existing.registration_status === 'pending') {
    if (!isStalePending(existing)) {
      throw new errors.ApplicationError('Tu inscripción está en proceso. Intenta de nuevo en unos segundos.');
    }
    // Reserva abandonada (por ejemplo, el servidor se reinició a mitad): se descarta y se reintenta
    await strapi.documents(REG).delete({ documentId: existing.documentId });
    existing = null;
  }

  if (webinar.event_status !== 'scheduled') throw new errors.ApplicationError('Este webinar no está disponible');
  if (webinar.registration_enabled === false) throw new errors.ApplicationError('Las inscripciones están cerradas');
  if (Date.now() > webinar.end.getTime()) throw new errors.ApplicationError('Este webinar ya finalizó');

  const taken = await strapi.documents(REG).count({
    filters: {
      webinar: { documentId: webinar.documentId },
      registration_status: { $in: [...ACTIVE, 'pending'] },
    },
  });
  if (webinar.capacity && taken >= webinar.capacity) {
    throw new errors.ApplicationError('El cupo de este webinar está lleno');
  }

  if (existing) {
    // Había cancelado: se reactiva la misma inscripción
    await strapi.documents(REG).update({
      documentId: existing.documentId,
      data: { registration_status: 'pending' },
    });
    try {
      await zoom.setRegistrantStatus(
        webinar.zoom_webinar_id,
        { registrantId: existing.zoom_registrant_id, email: user.email },
        'approve',
      );
    } catch (err) {
      await strapi.documents(REG).update({
        documentId: existing.documentId,
        data: { registration_status: 'cancelled' },
      });
      throw err;
    }
    const reactivated = await strapi.documents(REG).update({
      documentId: existing.documentId,
      data: {
        registration_status: 'registered',
        registered_at: new Date().toISOString(),
        cancelled_at: null,
        source,
      },
    });
    queueConfirmation(webinar, user, existing.documentId);
    return reactivated;
  }

  // 1) Reserva en Strapi
  const reserved = await strapi.documents(REG).create({
    data: {
      webinar: { connect: [{ documentId: webinar.documentId, status: 'published' }] },
      brain_user: { connect: [{ documentId: user.documentId, status: 'published' }] },
      registration_status: 'pending',
      source,
    },
  });

  // 2) Inscripción en Zoom; si falla, se deshace la reserva
  let zoomReg;
  try {
    zoomReg = await zoom.addRegistrant(webinar.zoom_webinar_id, {
      email: user.email,
      firstName: user.name || user.email,
      lastName: user.lastName || '-',
    });
  } catch (err) {
    await strapi.documents(REG).delete({ documentId: reserved.documentId });
    throw err;
  }

  // 3) Confirmar la reserva con los datos de Zoom
  let confirmed;
  try {
    confirmed = await strapi.documents(REG).update({
      documentId: reserved.documentId,
      data: {
        registration_status: 'registered',
        registered_at: new Date().toISOString(),
        zoom_registrant_id: zoomReg.registrantId,
        zoom_join_token: zoomReg.joinToken,
        zoom_join_url: zoomReg.joinUrl,
      },
    });
  } catch (err) {
    // Muy poco probable; se deshace todo para no dejar estados a medias
    await zoom
      .setRegistrantStatus(webinar.zoom_webinar_id, { registrantId: zoomReg.registrantId, email: user.email }, 'cancel')
      .catch((e) => strapi.log.error(`[webinar-registration] No se pudo cancelar en Zoom: ${e.message}`));
    await strapi.documents(REG).delete({ documentId: reserved.documentId }).catch(() => {});
    throw err;
  }

  queueConfirmation(webinar, user, reserved.documentId);
  return confirmed;
}

// Respuesta mínima para el frontend: nunca incluye datos de Zoom
const publicView = (reg) => ({
  status: reg.registration_status,
  registeredAt: reg.registered_at,
  cancelledAt: reg.cancelled_at,
});

// Ventanas de recordatorio (tiempo que falta para el inicio)
const HOUR = 3_600_000;
const REMINDER_PLAN = [
  { kind: '3d', field: 'reminder_3d_sent_at', from: 48 * HOUR, to: 72 * HOUR },
  { kind: '1d', field: 'reminder_1d_sent_at', from: 12 * HOUR, to: 24 * HOUR },
  { kind: '1h', field: 'reminder_1h_sent_at', from: 0, to: 75 * 60_000 },
];

// --- Controlador ---

module.exports = factories.createCoreController(REG, () => ({
  // Estado de inscripción del usuario en un webinar (status null = no inscrito)
  async status(ctx) {
    const user = await getUser(ctx);
    const webinar = await getWebinar(ctx.params.documentId);
    const reg = await findRegistration(webinar, user);
    ctx.body = reg ? publicView(reg) : { status: null, registeredAt: null, cancelledAt: null };
  },

  async register(ctx) {
    const user = await getUser(ctx);
    const webinar = await getWebinar(ctx.params.documentId);
    const reg = await ensureRegistration(webinar, user, 'web');
    ctx.body = publicView(reg);
  },

  async cancel(ctx) {
    const user = await getUser(ctx);
    const webinar = await getWebinar(ctx.params.documentId);
    const reg = await findRegistration(webinar, user);
    if (!reg || !ACTIVE.includes(reg.registration_status)) {
      throw new errors.NotFoundError('No tienes una inscripción activa en este webinar');
    }

    await zoom.setRegistrantStatus(
      webinar.zoom_webinar_id,
      { registrantId: reg.zoom_registrant_id, email: user.email },
      'cancel',
    );
    const updated = await strapi.documents(REG).update({
      documentId: reg.documentId,
      data: { registration_status: 'cancelled', cancelled_at: new Date().toISOString() },
    });
    setImmediate(() =>
      emails.sendRegistrationCancelled(webinar, user).catch((err) =>
        strapi.log.error(`[webinar-emails] Cancelación a ${user.email}: ${err.message}`),
      ),
    );
    ctx.body = publicView(updated);
  },

  async join(ctx) {
    const user = await getUser(ctx);
    const webinar = await getWebinar(ctx.params.documentId);

    if (webinar.event_status !== 'scheduled') throw new errors.ApplicationError('Este webinar no está disponible');

    const opens = webinar.start.getTime() - JOIN_BEFORE_MIN * 60_000;
    const closes = webinar.end.getTime() + JOIN_AFTER_MIN * 60_000;
    const now = Date.now();
    if (now < opens) {
      throw new errors.ApplicationError('La sala aún no está abierta', { opensAt: new Date(opens).toISOString() });
    }
    if (now > closes) throw new errors.ApplicationError('Este webinar ya finalizó');

    // Si no estaba inscrito, se inscribe en este momento
    const reg = await ensureRegistration(webinar, user, 'on_join');

    ctx.body = {
      signature: zoom.sdkSignature(webinar.zoom_webinar_id),
      meetingNumber: webinar.zoom_webinar_id,
      password: webinar.zoom_passcode || '',
      userName: [user.name, user.lastName].filter(Boolean).join(' ') || user.email,
      userEmail: user.email,
      tk: reg.zoom_join_token || '',
      // Respaldo para inscripciones hechas antes de guardar el enlace
      joinUrl: reg.zoom_join_url || `https://zoom.us/w/${webinar.zoom_webinar_id}?tk=${reg.zoom_join_token || ''}`,
    };
  },

  // Recordatorios 3 días, 1 día y 1 hora antes. La llama Cloud Scheduler cada 15 minutos.
  async runJobs(ctx) {
    const secret = process.env.CRON_SECRET;
    if (!secret || ctx.get('X-Cron-Secret') !== secret) {
      throw new errors.UnauthorizedError('No autorizado');
    }

    const now = Date.now();
    const summary = {};

    for (const plan of REMINDER_PLAN) {
      const regs = await strapi.documents(REG).findMany({
        status: 'published',
        filters: {
          registration_status: 'registered',
          [plan.field]: { $null: true },
          webinar: {
            event_status: 'scheduled',
            start_datetime: {
              $gt: new Date(now + plan.from).toISOString(),
              $lte: new Date(now + plan.to).toISOString(),
            },
          },
        },
        populate: { webinar: true, brain_user: { fields: ['email', 'name', 'lastName'] } },
        limit: 1000,
      });

      let sent = 0;
      for (const reg of regs) {
        if (!reg.brain_user?.email || !reg.webinar) continue;
        try {
          await emails.sendReminder(reg.webinar, reg.brain_user, plan.kind);
          await strapi.documents(REG).update({
            documentId: reg.documentId,
            data: { [plan.field]: new Date().toISOString() },
          });
          sent++;
        } catch (err) {
          strapi.log.error(`[webinar-reminders] ${plan.kind} a ${reg.brain_user.email}: ${err.message}`);
        }
      }
      summary[plan.kind] = { pendientes: regs.length, enviados: sent };
    }

    const asistencia = await attendance.reconcileDue();
    ctx.body = { recordatorios: summary, asistencia };
  },
}));
