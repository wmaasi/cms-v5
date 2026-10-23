'use strict';

const { sendDynamicTemplateEmail } = require('../extensions/notifications/services/sendgrid');

const TIMEZONE = 'America/Guatemala';
const REG = 'api::webinar-registration.webinar-registration';

const templateId = () => process.env.SENDGRID_TEMPLATE_WEBINAR_NOTICE;

// --- Formato ---

const slugify = (s) => (s || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

const webinarUrl = (w) =>
  `${process.env.PUBLIC_SITE_URL}/search/webinars/${w.documentId}_${slugify(w.slug || w.title)}`;

const startOf = (w) => new Date(w.start_datetime);
const endOf = (w) => new Date(startOf(w).getTime() + (w.duration_minutes || 0) * 60_000);

const fmtDate = (d) =>
  new Intl.DateTimeFormat('es-GT', { timeZone: TIMEZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
const fmtTime = (d) =>
  new Intl.DateTimeFormat('es-GT', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);

const firstName = (user) => user?.name || '';

// --- Archivo .ics (calendario) ---

const icsDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Las líneas de un .ics no deben pasar de 75 caracteres
const fold = (line) => {
  const parts = [];
  let rest = line;
  while (rest.length > 75) { parts.push(rest.slice(0, 75)); rest = ' ' + rest.slice(75); }
  parts.push(rest);
  return parts.join('\r\n');
};

function buildIcs(webinar) {
  const url = webinarUrl(webinar);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agexport//Portal Brain//ES',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${webinar.documentId}@brain.export.com.gt`,
    `SEQUENCE:${Math.floor(new Date(webinar.updatedAt || Date.now()).getTime() / 1000)}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(startOf(webinar))}`,
    `DTEND:${icsDate(endOf(webinar))}`,
    `SUMMARY:${icsText(webinar.title)}`,
    `DESCRIPTION:${icsText(`Ingresa a Portal Brain para unirte al webinar: ${url}`)}`,
    `LOCATION:${icsText(url)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return {
    content: Buffer.from(lines.map(fold).join('\r\n')).toString('base64'),
    filename: 'webinar.ics',
    type: 'text/calendar',
    disposition: 'attachment',
  };
}

// --- Envío base ---

async function send({ to, webinar, subject, heading, message, buttonText, buttonUrl, withIcs }) {
  const start = startOf(webinar);
  await sendDynamicTemplateEmail({
    to,
    templateId: templateId(),
    dynamicData: {
      subject,
      heading,
      message,
      event_title: webinar.title,
      event_date: fmtDate(start),
      event_time: `${fmtTime(start)} – ${fmtTime(endOf(webinar))} (hora de Guatemala)`,
      event_speaker: webinar.speaker || '',
      button_text: buttonText || 'Ver webinar',
      button_url: buttonUrl || webinarUrl(webinar),
    },
    customArgs: { system: 'brain', entity_type: 'webinar', entity_id: webinar.documentId, entity_title: webinar.title },
    attachments: withIcs ? [buildIcs(webinar)] : undefined,
  });
}

// --- Correos individuales ---

async function sendRegistrationConfirmed(webinar, user) {
  await send({
    to: user.email,
    webinar,
    subject: `Inscripción confirmada: ${webinar.title}`,
    heading: '¡Tu inscripción está confirmada!',
    message: `Hola ${firstName(user)}, te esperamos en el webinar. El día del evento, ingresa a Portal Brain con tu usuario y entra a la sala desde la página del webinar. La sala abre 30 minutos antes del inicio. Adjuntamos el evento para que lo agregues a tu calendario.`,
    withIcs: true,
  });
}

async function sendRegistrationCancelled(webinar, user) {
  await send({
    to: user.email,
    webinar,
    subject: `Inscripción cancelada: ${webinar.title}`,
    heading: 'Cancelaste tu inscripción',
    message: `Hola ${firstName(user)}, tu inscripción a este webinar fue cancelada. Si fue un error, puedes volver a inscribirte desde la página del webinar.`,
  });
}

const REMINDERS = {
  '3d': { subject: 'Faltan 3 días', heading: 'Faltan 3 días para el webinar' },
  '1d': { subject: 'Es mañana', heading: 'El webinar es mañana' },
  '1h': { subject: 'Comienza en 1 hora', heading: 'El webinar comienza en 1 hora' },
};

async function sendReminder(webinar, user, kind) {
  const r = REMINDERS[kind];
  await send({
    to: user.email,
    webinar,
    subject: `${r.subject}: ${webinar.title}`,
    heading: r.heading,
    message: kind === '1h'
      ? `Hola ${firstName(user)}, la sala ya está abierta. Ingresa a Portal Brain y entra desde la página del webinar.`
      : `Hola ${firstName(user)}, te recordamos que estás inscrito en este webinar. El día del evento, la sala abre 30 minutos antes del inicio.`,
    buttonText: kind === '1h' ? 'Entrar al webinar' : 'Ver webinar',
  });
}

// --- Correos a todos los inscritos de un webinar ---

async function activeRegistrations(webinar) {
  return strapi.documents(REG).findMany({
    filters: { webinar: { documentId: webinar.documentId }, registration_status: { $in: ['registered', 'attended'] } },
    populate: { brain_user: { fields: ['email', 'name', 'lastName'] } },
    limit: 1000,
  });
}

async function sendToAll(webinar, buildFn) {
  const regs = await activeRegistrations(webinar);
  for (const reg of regs) {
    if (!reg.brain_user?.email) continue;
    await buildFn(reg.brain_user).catch((err) =>
      strapi.log.error(`[webinar-emails] Error enviando a ${reg.brain_user.email}: ${err.message}`),
    );
  }
}

async function sendEventCancelled(webinar) {
  await sendToAll(webinar, (user) =>
    send({
      to: user.email,
      webinar,
      subject: `Webinar cancelado: ${webinar.title}`,
      heading: 'El webinar fue cancelado',
      message: `Hola ${firstName(user)}, lamentamos informarte que este webinar fue cancelado. Te avisaremos de próximos eventos en Portal Brain.`,
    }),
  );
}

async function sendScheduleChanged(webinar) {
  await sendToAll(webinar, (user) =>
    send({
      to: user.email,
      webinar,
      subject: `Cambio de horario: ${webinar.title}`,
      heading: 'Cambió la fecha u hora del webinar',
      message: `Hola ${firstName(user)}, el webinar en el que estás inscrito tiene una nueva fecha u hora. Tu inscripción sigue activa. Adjuntamos el evento actualizado para tu calendario.`,
      withIcs: true,
    }),
  );
}

module.exports = {
  sendRegistrationConfirmed,
  sendRegistrationCancelled,
  sendReminder,
  sendEventCancelled,
  sendScheduleChanged,
};
