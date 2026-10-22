'use strict';

const { factories } = require('@strapi/strapi');
const { errors } = require('@strapi/utils');
const zoom = require('../../../lib/zoom');

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
    // TODO(correos): confirmación de inscripción
    return strapi.documents(REG).update({
      documentId: existing.documentId,
      data: {
        registration_status: 'registered',
        registered_at: new Date().toISOString(),
        cancelled_at: null,
        source,
      },
    });
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
  try {
    // TODO(correos): confirmación de inscripción
    return await strapi.documents(REG).update({
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
}

// Respuesta mínima para el frontend: nunca incluye datos de Zoom
const publicView = (reg) => ({
  status: reg.registration_status,
  registeredAt: reg.registered_at,
  cancelledAt: reg.cancelled_at,
});

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
    // TODO(correos): confirmación de cancelación
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
}));
