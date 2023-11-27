'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('objectives', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      types: {
        type: Sequelize.ENUM('Info', 'Sales', 'Actions'),
        defaultValue: 'Info'
      },
      brandId: {
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.TEXT
      },
      weight: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      start_date: {
        type: Sequelize.DATE
      },
      end_date: {
        type: Sequelize.DATE
      },
      salesTypes: {
        type: Sequelize.ENUM('ABSOLUTE', 'GROWTH_LAST_YEAR', 'GROWTH_LAST_MONTH', 'GROWTH_LAST_VISIT'),
        allowNull: true,
        defaultValue: null
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
    await queryInterface.addConstraint('objectives', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'objectives_brandId_fkey',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('objectives', 'objectives_brandId_fkey');
    await queryInterface.dropTable('objectives');
  }
};