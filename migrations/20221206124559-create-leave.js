'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leaves', {
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
      documentId: {
        type: Sequelize.INTEGER
      },
      closeStatus: {
        type: Sequelize.ENUM('OPENED', 'CLOSED'),
        defaultValue: 'OPENED'
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
      approvalStatus: {
        type: Sequelize.ENUM('REGISTERED', 'APPROVED'),
        defaultValue: 'REGISTERED'
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
    await queryInterface.addConstraint('leaves', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'leaves_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('leaves', {
      fields: ['approverId'],
      type: 'foreign key',
      name: 'leaves_approverId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('leaves', {
      fields: ['documentId'],
      type: 'foreign key',
      name: 'leaves_documentId_fkey',
      references: {
        table: 'statics',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('leaves', 'leaves_documentId_fkey');
    await queryInterface.removeConstraint('leaves', 'leaves_approverId_fkey');
    await queryInterface.removeConstraint('leaves', 'leaves_userId_fkey');
    await queryInterface.dropTable('leaves');
  }
};