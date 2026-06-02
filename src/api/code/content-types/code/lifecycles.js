module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    const code = data.code || '';
    const classification = data.classification || '';
    data.slug = `${classification} - ${code}`;
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    if (data.code || data.classification) {
      const existingEntry = await strapi.db.query('api::code.code').findOne({
        where: { id: event.params.where.id },
        select: ['code', 'classification'],
      });
      const code = data.code || existingEntry.code || '';
      const classification = data.classification || existingEntry.classification || '';
      data.slug = `${classification} - ${code}`;
    }
  },
};
