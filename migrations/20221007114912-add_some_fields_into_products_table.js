'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('products', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addColumn('products', 'pro_ean',
        {
          type: Sequelize.STRING
        }),
      queryInterface.addColumn('products', 'description',
        {
          type: Sequelize.TEXT
        }),
      queryInterface.addColumn('products', 'short_description',
        {
          type: Sequelize.STRING
        }),
      queryInterface.addColumn('products', 'units_per_fraction',
        {
          type: Sequelize.INTEGER
        }),
      queryInterface.addColumn('products', 'units_per_box',
        {
          type: Sequelize.INTEGER
        }),
      queryInterface.addColumn('products', 'vat_code',
        {
          type: Sequelize.STRING
        }),
      queryInterface.addColumn('products', 'photos',
        {
          type: Sequelize.STRING
        }),
      queryInterface.addColumn('products', 'start_date',
        {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        }),
      queryInterface.addColumn('products', 'end_date',
        {
          type: Sequelize.DATE,
        }),
      queryInterface.addColumn('products', 'status',
        {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active'
        }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('products');
     */
    return Promise.all([
      queryInterface.removeColumn('products', 'pro_ean'),
      queryInterface.removeColumn('products', 'description'),
      queryInterface.removeColumn('products', 'short_description'),
      queryInterface.removeColumn('products', 'units_per_fraction'),
      queryInterface.removeColumn('products', 'units_per_box'),
      queryInterface.removeColumn('products', 'vat_code'),
      queryInterface.removeColumn('products', 'photos'),
      queryInterface.removeColumn('products', 'start_date'),
      queryInterface.removeColumn('products', 'end_date'),
      queryInterface.removeColumn('products', 'status'),
    ]);
  }
};
