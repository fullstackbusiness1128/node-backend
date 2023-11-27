'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('brand_onepage_pos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      brandOnePageId: {
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
    await queryInterface.addConstraint('brand_onepage_pos', {
      fields: ['brandOnePageId'],
      type: 'foreign key',
      name: 'bop_fk_brandOnePageId',
      references: {
        table: 'brand_onepages',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('brand_onepage_pos', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'bop_fk_posId',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('brand_onepage_pos', 'bop_fk_posId');
    await queryInterface.removeConstraint('brand_onepage_pos', 'bop_fk_brandOnePageId');
    await queryInterface.dropTable('brand_onepage_pos');
  }
};