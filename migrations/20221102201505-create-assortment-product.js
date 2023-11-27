'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assortment_products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      assortmentId: {
        type: Sequelize.INTEGER
      },
      productId: {
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
    await queryInterface.addConstraint('assortment_products', {
      fields: ['assortmentId'],
      type: 'foreign key',
      name: 'assortment_products_assortmentId_fkey',
      references: {
        table: 'assortments',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('assortment_products', {
      fields: ['productId'],
      type: 'foreign key',
      name: 'assortment_products_productId_fkey',
      references: {
        table: 'products',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.removeConstraint('assortments', 'assortments_product_id_fkey');
    await queryInterface.removeColumn('assortments', 'product_id');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('assortments', 'product_id',
      {
        type: Sequelize.INTEGER,
        after: "brand_id",
      });
    await queryInterface.addConstraint('assortments', {
      fields: ['product_id'],
      type: 'foreign key',
      name: 'assortments_product_id_fkey',
      references: {
        table: 'products',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.removeConstraint('assortment_products', 'assortment_products_productId_fkey');
    await queryInterface.removeConstraint('assortment_products', 'assortment_products_assortmentId_fkey');
    await queryInterface.dropTable('assortment_products');
  }
};