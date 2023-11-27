'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('route_pos', 'status',
      {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
        after: "brandId",
      });
    await queryInterface.addColumn('route_pos', 'surveyId',
      {
        type: Sequelize.INTEGER,
        after: "brandId",
      });
    await queryInterface.addConstraint('route_pos', {
      fields: ['surveyId'],
      type: 'foreign key',
      name: 'route_pos_surveyId_fkey',
      references: {
        table: 'surveys',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('route_pos', 'route_pos_surveyId_fkey');
    await queryInterface.removeColumn('route_pos', 'surveyId');
    await queryInterface.removeColumn('route_pos', 'status');
  }
};
