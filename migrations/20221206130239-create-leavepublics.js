'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leavepublics', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      leaveId: {
        type: Sequelize.INTEGER
      },
      publicholiday: {
        type: Sequelize.DATEONLY
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
    await queryInterface.addConstraint('leavepublics', {
      fields: ['leaveId'],
      type: 'foreign key',
      name: 'leavepublics_leaveId_fkey',
      references: {
        table: 'leaves',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('leavepublics', 'leavepublics_leaveId_fkey');
    await queryInterface.dropTable('leavepublics');
  }
};