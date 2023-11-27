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
      queryInterface.addColumn('routes', 'status',
        {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active'
        }),
      queryInterface.addColumn('routes', 'zoneId',
        {
          type: Sequelize.INTEGER,
        }),
      queryInterface.addConstraint('routes', {
        fields: ['zoneId'],
        type: 'foreign key',
        name: 'routes_zoneId_fkey',
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
      queryInterface.removeColumn('routes', 'status'),
      queryInterface.removeConstraint('routes', 'routes_zoneId_fkey'),
      queryInterface.removeColumn('routes', 'zoneId'),
    ])
  }
};
