'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addConstraint('products_sub_brands', {
        fields: ['pro_id'],
        type: 'foreign key',
        name: 'products_sub_brands_pro_id_fkey',
        references: {
          table: 'products',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('products_sub_brands', {
        fields: ['brand_id'],
        type: 'foreign key',
        name: 'products_sub_brands_brand_id_fkey',
        references: {
          table: 'brands',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('products_sub_brands', {
        fields: ['parent_brand_id'],
        type: 'foreign key',
        name: 'products_sub_brands_parent_brand_id_fkey',
        references: {
          table: 'brands',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     return Promise.all([
      queryInterface.removeConstraint('products_sub_brands', 'products_sub_brands_pro_id_fkey'),
      queryInterface.removeConstraint('products_sub_brands', 'products_sub_brands_brand_id_fkey'),
      queryInterface.removeConstraint('products_sub_brands', 'products_sub_brands_parent_brand_id_fkey'),
     ]);
  }
};
