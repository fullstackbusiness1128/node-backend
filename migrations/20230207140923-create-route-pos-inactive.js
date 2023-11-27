'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_pos_inactives', {
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
      reasonType: {
        type: Sequelize.ENUM('CLOSINGBUSINESS', 'DONTWORKCATEGORY', 'SERVICEPROBLEMS', 'PRICEPRODUCTROTATION', 'OTHERS'),
        defaultValue: 'OTHERS'
      },
      gpvComments: {
        type: Sequelize.TEXT
      },
      photoId: {
        type: Sequelize.INTEGER
      },
      responsableApprovalStatus: {
        type: Sequelize.ENUM('PENDING', 'INCIDENCE', 'APPROVED'),
        defaultValue: 'PENDING'
      },
      responsableComments: {
        type: Sequelize.TEXT
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
    await queryInterface.addConstraint('route_pos_inactives', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'rpi_fk_userId',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_inactives', {
      fields: ['routeId'],
      type: 'foreign key',
      name: 'rpi_fk_routeId',
      references: {
        table: 'routes',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_inactives', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'rpi_fk_posId',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_inactives', {
      fields: ['photoId'],
      type: 'foreign key',
      name: 'rpi_fk_photoId',
      references: {
        table: 'statics',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('route_pos_inactives', 'rpi_fk_photoId');
    await queryInterface.removeConstraint('route_pos_inactives', 'rpi_fk_posId');
    await queryInterface.removeConstraint('route_pos_inactives', 'rpi_fk_routeId');
    await queryInterface.removeConstraint('route_pos_inactives', 'rpi_fk_userId');
    await queryInterface.dropTable('route_pos_inactives');
  }
};