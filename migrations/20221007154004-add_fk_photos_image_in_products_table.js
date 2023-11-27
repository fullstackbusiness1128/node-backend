'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addConstraint('products', {
        fields: ['photos'],
        type: 'foreign key',
        name: 'products_photos_fkey',
        references: {
          table: 'statics',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      }),
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     return Promise.all([
      queryInterface.removeConstraint('products', 'products_photos_fkey'),
     ]);
  }
};
