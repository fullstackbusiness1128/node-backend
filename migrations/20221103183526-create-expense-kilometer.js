'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expense_kilometers', {
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
      startKM: {
        type: Sequelize.FLOAT
      },
      startPhotoId: {
        type: Sequelize.INTEGER
      },
      endKM: {
        type: Sequelize.FLOAT
      },
      endPhotoId: {
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
    await queryInterface.addConstraint('expense_kilometers', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'expense_kilometers_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'no action',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('expense_kilometers', {
      fields: ['routeId'],
      type: 'foreign key',
      name: 'expense_kilometers_routeId_fkey',
      references: {
        table: 'routes',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('expense_kilometers', {
      fields: ['expenseTypeId'],
      type: 'foreign key',
      name: 'expense_kilometers_expenseTypeId_fkey',
      references: {
        table: 'expense_types',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('expense_kilometers', {
      fields: ['startPhotoId'],
      type: 'foreign key',
      name: 'expense_kilometers_startPhotoId_fkey',
      references: {
        table: 'statics',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('expense_kilometers', {
      fields: ['endPhotoId'],
      type: 'foreign key',
      name: 'expense_kilometers_endPhotoId_fkey',
      references: {
        table: 'statics',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('expense_kilometers', {
      fields: ['approverId'],
      type: 'foreign key',
      name: 'expense_kilometers_approverId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'no action',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('expense_kilometers', 'expense_kilometers_approverId_fkey');
    await queryInterface.removeConstraint('expense_kilometers', 'expense_kilometers_endPhotoId_fkey');
    await queryInterface.removeConstraint('expense_kilometers', 'expense_kilometers_startPhotoId_fkey');
    await queryInterface.removeConstraint('expense_kilometers', 'expense_kilometers_expenseTypeId_fkey');
    await queryInterface.removeConstraint('expense_kilometers', 'expense_kilometers_routeId_fkey');
    await queryInterface.removeConstraint('expense_kilometers', 'expense_kilometers_userId_fkey');
    await queryInterface.dropTable('expense_kilometers');
  }
};