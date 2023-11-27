'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('liquidations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      year: {
        type: Sequelize.INTEGER
      },
      month: {
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      attachment_document: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.ENUM('PendingFullfillKM', 'LineIncidence', 'AllLinesApproved', 'LiquidationSent', 'LiquidationIncidence', 'LiquidationAproved', 'Liquidated'),
        defaultValue: 'PendingFullfillKM'
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
      km_total: {
        type: Sequelize.FLOAT
      },
      km_pending_approval: {
        type: Sequelize.FLOAT
      },
      expense_total: {
        type: Sequelize.FLOAT
      },
      expense_pending_approval: {
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
    await queryInterface.addConstraint('liquidations', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'liquidations_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'no action',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('liquidations', {
      fields: ['attachment_document'],
      type: 'foreign key',
      name: 'liquidations_attachment_document_fkey',
      references: {
        table: 'statics',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('liquidations', {
      fields: ['approverId'],
      type: 'foreign key',
      name: 'liquidations_approverId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'no action',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('liquidations', 'liquidations_approverId_fkey');
    await queryInterface.removeConstraint('liquidations', 'liquidations_attachment_document_fkey');
    await queryInterface.removeConstraint('liquidations', 'liquidations_userId_fkey');
    await queryInterface.dropTable('liquidations');
  }
};