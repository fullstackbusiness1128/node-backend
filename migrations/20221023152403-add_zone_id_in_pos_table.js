'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addColumn('pos', 'zoneId',
        {
          type: Sequelize.INTEGER,
        }),
      queryInterface.addConstraint('pos', {
        fields: ['zoneId'],
        type: 'foreign key',
        name: 'pos_zoneId_fkey',
        references: {
          table: 'zones',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      }),
    ])
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return Promise.all([
      queryInterface.removeConstraint('pos', 'pos_zoneId_fkey'),
      queryInterface.removeColumn('pos', 'zoneId'),
    ])
  }
};
