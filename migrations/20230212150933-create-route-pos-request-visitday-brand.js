'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_pos_request_visitday_brands', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      routePosRequestVisitdayId: {
        type: Sequelize.INTEGER
      },
      brandId: {
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
    await queryInterface.addConstraint('route_pos_request_visitday_brands', {
      fields: ['routePosRequestVisitdayId'],
      type: 'foreign key',
      name: 'rprvb_fk_routePosRequestVisitdayId',
      references: {
        table: 'route_pos_request_visitdays',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_request_visitday_brands', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'rprvb_fk_brandId',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('route_pos_request_visitday_brands', 'rprvb_fk_brandId');
    await queryInterface.removeConstraint('route_pos_request_visitday_brands', 'rprvb_fk_routePosRequestVisitdayId');
    await queryInterface.dropTable('route_pos_request_visitday_brands');
  }
};