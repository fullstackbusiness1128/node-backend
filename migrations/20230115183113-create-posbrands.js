'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('posbrands', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      posId: {
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
    await queryInterface.addConstraint('posbrands', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'posbrands_posId_fkey',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('posbrands', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'posbrands_brandId_fkey',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('posbrands', 'posbrands_brandId_fkey');
    await queryInterface.removeConstraint('posbrands', 'posbrands_posId_fkey');
    await queryInterface.dropTable('posbrands');
  }
};