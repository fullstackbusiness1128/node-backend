'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('objective_pos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      objectiveId: {
        type: Sequelize.INTEGER
      },
      posId: {
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
    await queryInterface.addConstraint('objective_pos', {
      fields: ['objectiveId'],
      type: 'foreign key',
      name: 'op_objectiveId_fkey',
      references: {
        table: 'objectives',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('objective_pos', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'op_posId_fkey',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('objective_pos', 'op_posId_fkey');
    await queryInterface.removeConstraint('objective_pos', 'op_objectiveId_fkey');
    await queryInterface.dropTable('objective_pos');
  }
};