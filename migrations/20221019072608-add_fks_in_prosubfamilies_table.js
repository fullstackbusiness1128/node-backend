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
      queryInterface.addConstraint('pro_sub_families', {
        fields: ['pro_id'],
        type: 'foreign key',
        name: 'pro_sub_families_pro_id_fkey',
        references: {
          table: 'products',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('pro_sub_families', {
        fields: ['sub_family_id'],
        type: 'foreign key',
        name: 'pro_sub_families_sub_family_id_fkey',
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
      queryInterface.removeConstraint('pro_sub_families', 'pro_sub_families_pro_id_fkey'),
      queryInterface.removeConstraint('pro_sub_families', 'pro_sub_families_sub_family_id_fkey'),
    ]);
  }
};
