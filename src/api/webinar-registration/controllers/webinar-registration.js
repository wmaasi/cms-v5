'use strict';

const { factories } = require('@strapi/strapi');
const { errors } = require('@strapi/utils');
const zoom = require('../../../lib/zoom');

const REG = 'api::webinar-registration.webinar-registration';
const WEBINAR = 'api::webinar.webinar';
const USER = 'api::brain-user.brain-user';

const JOIN_BEFORE_MIN = 30; // la sala abre 30 min antes
const JOIN_AFTER_MIN = 30;  // y cierra 30 min después del final programado

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

// Inscribe o reactiva. Se usa desde /register y desde /join (source = on_join).
async function ensureRegistration(webinar, user, source) {
  const existing = await findRegistration(webinar, user);
  if (existing && ACTIVE.includes(existing.registration_status)) return existing;

  if (webinar.event_status !== 'scheduled') throw new errors.ApplicationError('Este webinar no está disponible');
  if (webinar.registration_enabled === false) throw new errors.ApplicationError('Las inscripciones están cerradas');
  if (Date.now() > webinar.end.getTime()) throw new errors.ApplicationError('Este webinar ya finalizó');

  const taken = await strapi.documents(REG).count({
    filters: { webinar: { documentId: webinar.documentId }, registration_status: { $in: ACTIVE } },
  });
  if (webinar.capacity && taken >= webinar.capacity) {
    throw new errors.ApplicationError('El cupo de este webinar está lleno');
  }

  const now = new Date().toISOString();

  if (existing) {
    // Había cancelado: se reactiva la misma inscripción
    await zoom.setRegistrantStatus(
      webinar.zoom_webinar_id,
      { registrantId: existing.zoom_registrant_id, email: user.email },
      'approve',
    );
    // TODO(correos): confirmación de inscripción
    return strapi.documents(REG).update({
      documentId: existing.documentId,
      data: { registration_status: 'registered', registered_at: now, cancelled_at: null, source },
    });
  }

  const { registrantId, joinToken, joinUrl } = await zoom.addRegistrant(webinar.zoom_webinar_id, {
    email: user.email,
    firstName: user.name || user.email,
    lastName: user.lastName || '-',
  });

  // TODO(correos): confirmación de inscripción
  return strapi.documents(REG).create({
    data: {
      webinar: { connect: [webinar.documentId] },
      brain_user: { connect: [user.documentId] },
      registration_status: 'registered',
      source,
      registered_at: now,
      zoom_registrant_id: registrantId,
      zoom_join_token: joinToken,
      zoom_join_url: joinUrl,
    },
  });
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
