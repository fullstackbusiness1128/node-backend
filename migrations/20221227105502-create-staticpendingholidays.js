'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staticpendingholidays', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      appliedYear: {
        type: Sequelize.INTEGER
      },
      pendingholidays: {
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
    await queryInterface.addConstraint('staticpendingholidays', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'staticpendingholidays_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('staticpendingholidays', 'staticpendingholidays_userId_fkey');
    await queryInterface.dropTable('staticpendingholidays');
  }
};