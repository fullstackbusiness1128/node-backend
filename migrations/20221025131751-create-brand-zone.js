'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('brand_zones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      zoneId: {
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
    await queryInterface.addConstraint('brand_zones', {
      fields: ['zoneId'],
      type: 'foreign key',
      name: 'brand_zones_zoneId_fkey',
      references: {
        table: 'zones',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('brand_zones', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'brand_zones_brandId_fkey',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('brand_zones', 'brand_zones_brandId_fkey');
    await queryInterface.removeConstraint('brand_zones', 'brand_zones_zoneId_fkey');
    await queryInterface.dropTable('brand_zones');
  }
};