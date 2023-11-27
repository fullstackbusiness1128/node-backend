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
      queryInterface.addConstraint('products_sub_families', {
        fields: ['pro_id'],
        type: 'foreign key',
        name: 'products_sub_families_pro_id_fkey',
        references: {
          table: 'products',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('products_sub_families', {
        fields: ['family_id'],
        type: 'foreign key',
        name: 'products_sub_families_family_id_fkey',
        references: {
          table: 'families',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('products_sub_families', {
        fields: ['parent_family_id'],
        type: 'foreign key',
        name: 'products_sub_families_parent_family_id_fkey',
        references: {
          table: 'families',
          field: 'id'
        },
        onDelete: 'cascade',
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
      queryInterface.removeConstraint('products_sub_families', 'products_sub_families_pro_id_fkey'),
      queryInterface.removeConstraint('products_sub_families', 'products_sub_families_family_id_fkey'),
      queryInterface.removeConstraint('products_sub_families', 'products_sub_families_parent_family_id_fkey'),
     ]);
  }
};
