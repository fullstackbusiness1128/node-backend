'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('brand_promos_pos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      brandPromosId: {
        type: Sequelize.INTEGER
      },
      posId: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
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
    await queryInterface.addConstraint('brand_promos_pos', {
      fields: ['brandPromosId'],
      type: 'foreign key',
      name: 'bpp_fk_brandPromosId',
      references: {
        table: 'brand_promos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('brand_promos_pos', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'bpp_fk_posId',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('brand_promos_pos', 'bpp_fk_posId');
    await queryInterface.removeConstraint('brand_promos_pos', 'bpp_fk_brandPromosId');
    await queryInterface.dropTable('brand_promos_pos');
  }
};