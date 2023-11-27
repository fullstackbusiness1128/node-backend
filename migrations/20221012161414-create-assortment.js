'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Assortments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      brand_id: {
        type: Sequelize.INTEGER
      },
      product_id: {
        type: Sequelize.INTEGER
      },
      operator_id: {
        type: Sequelize.INTEGER
      },
      id_product_operator: {
        type: Sequelize.STRING
      },
      unit_price_without_vat: {
        type: Sequelize.DECIMAL(11,3)
      },
      returns_accepted: {
        type: Sequelize.ENUM('Yes', 'No'),
        defaultValue: 'Yes'
      },
      returns_max: {
        type: Sequelize.DECIMAL(11,3),
        defaultValue: 0
      },
      priority_label: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      priority_1: {
        type: Sequelize.TINYINT,
        defaultValue: 0
      },
      priority_2: {
        type: Sequelize.TINYINT,
        defaultValue: 0
      },
      novelty: {
        type: Sequelize.TINYINT,
        defaultValue: 0
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Assortments');
  }
};