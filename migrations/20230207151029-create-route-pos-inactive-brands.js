'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_pos_inactive_brands', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      routePosInactiveId: {
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
    await queryInterface.addConstraint('route_pos_inactive_brands', {
      fields: ['routePosInactiveId'],
      type: 'foreign key',
      name: 'rpib_fk_routePosInactiveId',
      references: {
        table: 'route_pos_inactives',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_inactive_brands', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'rpib_fk_brandId',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('route_pos_inactive_brands', 'rpib_fk_brandId');
    await queryInterface.removeConstraint('route_pos_inactive_brands', 'rpib_fk_routePosInactiveId');
    await queryInterface.dropTable('route_pos_inactive_brands');
  }
};