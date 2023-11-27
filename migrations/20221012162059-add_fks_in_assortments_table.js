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
      queryInterface.addConstraint('assortments', {
        fields: ['brand_id'],
        type: 'foreign key',
        name: 'assortments_brand_id_fkey',
        references: {
          table: 'brands',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('assortments', {
        fields: ['product_id'],
        type: 'foreign key',
        name: 'assortments_product_id_fkey',
        references: {
          table: 'products',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('assortments', {
        fields: ['operator_id'],
        type: 'foreign key',
        name: 'assortments_operator_id_fkey',
        references: {
          table: 'operators',
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
      queryInterface.removeConstraint('assortments', 'assortments_brand_id_fkey'),
      queryInterface.removeConstraint('assortments', 'assortments_product_id_fkey'),
      queryInterface.removeConstraint('assortments', 'assortments_operator_id_fkey'),
     ]);
  }
};
