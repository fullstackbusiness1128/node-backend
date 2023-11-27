'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('objective_routes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      objectiveId: {
        type: Sequelize.INTEGER
      },
      routeId: {
        type: Sequelize.INTEGER
      },
      value: {
        type: Sequelize.FLOAT
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
    await queryInterface.addConstraint('objective_routes', {
      fields: ['objectiveId'],
      type: 'foreign key',
      name: 'or_objectiveId_fkey',
      references: {
        table: 'objectives',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('objective_routes', {
      fields: ['routeId'],
      type: 'foreign key',
      name: 'or_routeId_fkey',
      references: {
        table: 'routes',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('objective_routes', 'or_routeId_fkey');
    await queryInterface.removeConstraint('objective_routes', 'or_objectiveId_fkey');
    await queryInterface.dropTable('objective_routes');
  }
};