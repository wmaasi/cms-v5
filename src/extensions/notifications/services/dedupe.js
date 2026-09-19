'use strict';

// Evita enviar dos veces el mismo correo cuando Strapi dispara afterCreate
// dos veces por el mismo documentId (fila borrador + fila publicada).
const seen = new Map();

function alreadyHandled(key, ttlMs = 60000) {
  const now = Date.now();
  for (const [k, t] of seen) {
    if (now - t > ttlMs) seen.delete(k);
  }
  if (seen.has(key)) return true;
  seen.set(key, now);
  return false;
}

module.exports = { alreadyHandled };
