'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_pos_surveys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      routePosId: {
        type: Sequelize.INTEGER
      },
      surveyId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addConstraint('route_pos_surveys', {
      fields: ['routePosId'],
      type: 'foreign key',
      name: 'rps_fk_routePosId',
      references: {
        table: 'route_pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_surveys', {
      fields: ['surveyId'],
      type: 'foreign key',
      name: 'rps_fk_surveyId',
      references: {
        table: 'surveys',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('route_pos_surveys', 'rps_fk_surveyId');
    await queryInterface.removeConstraint('route_pos_surveys', 'rps_fk_routePosId');
    await queryInterface.dropTable('route_pos_surveys');
  }
};