'use strict';

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    if (data.uid) return;

    if (!data.email) throw new Error('EMAIL_REQUIRED');
    if (!data.password) throw new Error('PASSWORD_REQUIRED');

    const firebaseAdmin = strapi.firebaseAdmin;
    if (!firebaseAdmin) throw new Error('FIREBASE_NOT_INITIALIZED');

    try {
      const userRecord = await firebaseAdmin.auth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.name || undefined,
      });

      data.uid = userRecord.uid;

      // Seguridad: nunca guardar password en Strapi
      delete data.password;

    } catch (err) {
      strapi.log.error('❌ Error creando usuario en Firebase:', err);

      if (err.code === 'auth/email-already-exists') {
        const e = new Error('FIREBASE_EMAIL_EXISTS');
        e.firebaseCode = err.code;
        throw e;
      }

      const e = new Error('FIREBASE_CREATE_USER_FAILED');
      e.firebaseCode = err.code || 'unknown';
      throw e;
    }
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;

    const firebaseAdmin = strapi.firebaseAdmin;
    if (!firebaseAdmin) throw new Error('FIREBASE_NOT_INITIALIZED');

    const users = await strapi.documents('api::brain-user.brain-user').findMany({
      filters: where,
      limit: 1,
    });

    if (!users || users.length === 0) return;

    const user = users[0];
    if (!user.uid) throw new Error('USER_WITHOUT_UID');

    const updateData = {};

    if (data.name)  updateData.displayName = data.name;
    if (data.email) updateData.email = data.email;
    if (typeof data.password === 'string' && data.password.length >= 6) {
      updateData.password = data.password;
    }

    if (Object.keys(updateData).length > 0) {
      try {
        await firebaseAdmin.auth().updateUser(user.uid, updateData);
      } catch (err) {
        strapi.log.error('❌ Error actualizando usuario en Firebase:', err);
        const e = new Error('FIREBASE_UPDATE_USER_FAILED');
        e.firebaseCode = err.code || 'unknown';
        throw e;
      }
    }

    if (data.password) delete data.password;
  },

  async beforeDelete(event) {
    const { where } = event.params;

    const firebaseAdmin = strapi.firebaseAdmin;
    if (!firebaseAdmin) throw new Error('FIREBASE_NOT_INITIALIZED');

    const users = await strapi.documents('api::brain-user.brain-user').findMany({
      filters: where,
      limit: 1,
    });

    if (!users || users.length === 0) return;

    const uid = users[0].uid;
    if (!uid) return;

    try {
      await firebaseAdmin.auth().deleteUser(uid);
    } catch (err) {
      strapi.log.error('❌ Error eliminando usuario en Firebase:', err);
      const e = new Error('FIREBASE_DELETE_USER_FAILED');
      e.firebaseCode = err.code || 'unknown';
      throw e;
    }
  },
};
