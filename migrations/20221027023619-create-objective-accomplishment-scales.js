'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('objective_accomplishment_scales', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      objectiveId: {
        type: Sequelize.INTEGER
      },
      orderNum: {
        type: Sequelize.INTEGER
      },
      fromValue: {
        type: Sequelize.INTEGER
      },
      toValue: {
        type: Sequelize.INTEGER
      },
      accomplishedValue: {
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
    await queryInterface.addConstraint('objective_accomplishment_scales', {
      fields: ['objectiveId'],
      type: 'foreign key',
      name: 'oac_objectiveId_fkey',
      references: {
        table: 'objectives',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('objective_accomplishment_scales', 'oac_objectiveId_fkey');
    await queryInterface.dropTable('objective_accomplishment_scales');
  }
};