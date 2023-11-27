'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expense_others', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      userId: {
        type: Sequelize.INTEGER
      },
      routeId: {
        type: Sequelize.INTEGER
      },
      expenseTypeId: {
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.TEXT
      },
      amount: {
        type: Sequelize.FLOAT
      },
      document: {
        type: Sequelize.INTEGER
      },
      approvalStatus: {
        type: Sequelize.ENUM('Pending', 'PendingApproval', 'Incidence', 'Approved'),
        defaultValue: 'Pending'
      },
      approverId: {
        type: Sequelize.INTEGER
      },
      gpv_comment: {
        type: Sequelize.TEXT
      },
      spv_comment: {
        type: Sequelize.TEXT
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
    await queryInterface.addConstraint('expense_others', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'expense_others_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'no action',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('expense_others', {
      fields: ['routeId'],
      type: 'foreign key',
      name: 'expense_others_routeId_fkey',
      references: {
        table: 'routes',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('expense_others', {
      fields: ['expenseTypeId'],
      type: 'foreign key',
      name: 'expense_others_expenseTypeId_fkey',
      references: {
        table: 'expense_types',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('expense_others', {
      fields: ['document'],
      type: 'foreign key',
      name: 'expense_others_document_fkey',
      references: {
        table: 'statics',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('expense_others', {
      fields: ['approverId'],
      type: 'foreign key',
      name: 'expense_others_approverId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'no action',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('expense_others', 'expense_others_approverId_fkey');
    await queryInterface.removeConstraint('expense_others', 'expense_others_document_fkey');
    await queryInterface.removeConstraint('expense_others', 'expense_others_expenseTypeId_fkey');
    await queryInterface.removeConstraint('expense_others', 'expense_others_routeId_fkey');
    await queryInterface.removeConstraint('expense_others', 'expense_others_userId_fkey');
    await queryInterface.dropTable('expense_others');
  }
};