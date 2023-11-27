'use strict';

const { query } = require("express");

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeConstraint('pro_sub_brands', 'pro_sub_brands_sub_brand_id_fkey');
    await queryInterface.removeColumn('pro_sub_brands', 'sub_brand_id');
    await queryInterface.addColumn('pro_sub_brands', 'sub_brand_id',
      {
        type: Sequelize.INTEGER
      });
    await queryInterface.addConstraint('pro_sub_brands', {
      fields: ['sub_brand_id'],
      type: 'foreign key',
      name: 'pro_sub_brands_sub_brand_id_fkey',
      references: {
        table: 'subbrands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('pro_sub_brands', 'pro_sub_brands_sub_brand_id_fkey');
    await queryInterface.removeColumn('pro_sub_brands', 'sub_brand_id');
    await queryInterface.addColumn('pro_sub_brands', 'sub_brand_id',
      {
        type: Sequelize.INTEGER
      });
    await queryInterface.addConstraint('pro_sub_brands', {
      fields: ['sub_brand_id'],
      type: 'foreign key',
      name: 'pro_sub_brands_sub_brand_id_fkey',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  }
};
