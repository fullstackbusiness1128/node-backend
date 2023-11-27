'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('holidays', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      startDate: {
        type: Sequelize.DATEONLY
      },
      endDate: {
        type: Sequelize.DATEONLY
      },
      publicholiday_municipality: {
        type: Sequelize.STRING
      },
      employee_comments: {
        type: Sequelize.TEXT
      },
      responsible_comments: {
        type: Sequelize.TEXT
      },
      approverId: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.ENUM('PENDINGAPPROVAL', 'INCIDENCE', 'APPROVED'),
        defaultValue: 'PENDINGAPPROVAL'
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
    await queryInterface.addConstraint('holidays', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'holidays_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('holidays', {
      fields: ['approverId'],
      type: 'foreign key',
      name: 'holidays_approverId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('holidays', 'holidays_approverId_fkey');
    await queryInterface.removeConstraint('holidays', 'holidays_userId_fkey');
    await queryInterface.dropTable('holidays');
  }
};