'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_pos_request_visitdays', {
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
      posId: {
        type: Sequelize.INTEGER
      },
      w1: {
        type: Sequelize.STRING
      },
      w2: {
        type: Sequelize.STRING
      },
      w3: {
        type: Sequelize.STRING
      },
      w4: {
        type: Sequelize.STRING
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
    await queryInterface.addConstraint('route_pos_request_visitdays', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'rprv_fk_userId',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_request_visitdays', {
      fields: ['routeId'],
      type: 'foreign key',
      name: 'rprv_fk_routeId',
      references: {
        table: 'routes',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_request_visitdays', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'rprv_fk_posId',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_request_visitdays', {
      fields: ['responsableId'],
      type: 'foreign key',
      name: 'rprv_fk_responsableId',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_request_visitdays', {
      fields: ['adminId'],
      type: 'foreign key',
      name: 'rprv_fk_adminId',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('route_pos_request_visitdays', 'rprv_fk_adminId');
    await queryInterface.removeConstraint('route_pos_request_visitdays', 'rprv_fk_responsableId');
    await queryInterface.removeConstraint('route_pos_request_visitdays', 'rprv_fk_posId');
    await queryInterface.removeConstraint('route_pos_request_visitdays', 'rprv_fk_routeId');
    await queryInterface.removeConstraint('route_pos_request_visitdays', 'rprv_fk_userId');
    await queryInterface.dropTable('route_pos_request_visitdays');
  }
};