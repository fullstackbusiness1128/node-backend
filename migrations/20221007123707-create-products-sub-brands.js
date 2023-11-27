'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products_sub_brands', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      pro_id: {
        type: Sequelize.INTEGER
      },
      brand_id: {
        type: Sequelize.INTEGER
      },
      parent_brand_id: {
        type: Sequelize.INTEGER
      },
      tree_path: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('products_sub_brands');
  }
};