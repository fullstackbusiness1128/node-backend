'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pos_new_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      routeId: {
        type: Sequelize.INTEGER
      },
      posId: {
        type: Sequelize.INTEGER
      },
      gpvComments: {
        type: Sequelize.TEXT
      },
      responsableId: {
        type: Sequelize.INTEGER
      },
      responsableApprovalStatus: {
        type: Sequelize.ENUM('PENDING', 'INCIDENCE', 'APPROVED'),
        defaultValue: 'PENDING'
      },
      responsableComments: {
        type: Sequelize.TEXT
      },
      adminId: {
        type: Sequelize.INTEGER
      },
      adminApprovalStatus: {
        type: Sequelize.ENUM('PENDING', 'INCIDENCE', 'APPROVED'),
        defaultValue: 'PENDING'
      },
      adminComments: {
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
    await queryInterface.addConstraint('pos_new_requests', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'pnr_fk_userId',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('pos_new_requests', {
      fields: ['routeId'],
      type: 'foreign key',
      name: 'pnr_fk_routeId',
      references: {
        table: 'routes',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('pos_new_requests', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'pnr_fk_posId',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('pos_new_requests', {
      fields: ['responsableId'],
      type: 'foreign key',
      name: 'pnr_fk_responsableId',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('pos_new_requests', {
      fields: ['adminId'],
      type: 'foreign key',
      name: 'pnr_fk_adminId',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('pos_new_requests', 'pnr_fk_adminId');
    await queryInterface.removeConstraint('pos_new_requests', 'pnr_fk_responsableId');
    await queryInterface.removeConstraint('pos_new_requests', 'pnr_fk_posId');
    await queryInterface.removeConstraint('pos_new_requests', 'pnr_fk_routeId');
    await queryInterface.removeConstraint('pos_new_requests', 'pnr_fk_userId');
    await queryInterface.dropTable('pos_new_requests');
  }
};