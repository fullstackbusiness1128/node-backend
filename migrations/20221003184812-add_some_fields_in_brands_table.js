'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('brands', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addColumn('brands', 'status',
        {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active'
        }),
      queryInterface.addColumn('brands', 'start_date',
        {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        }),
      queryInterface.addColumn('brands', 'end_date',
        {
          type: Sequelize.DATE,
        }),
      queryInterface.addColumn('brands', 'module_info',
        {
          type: Sequelize.ENUM('Yes', 'No'),
          defaultValue: 'Yes'
        }),
      queryInterface.addColumn('brands', 'module_sales',
        {
          type: Sequelize.ENUM('Yes', 'No'),
          defaultValue: 'Yes'
        }),
      queryInterface.addColumn('brands', 'module_actions',
        {
          type: Sequelize.ENUM('Yes', 'No'),
          defaultValue: 'Yes'
        }),
      queryInterface.addColumn('brands', 'platform_photos',
        {
          type: Sequelize.ENUM('Yes', 'No'),
          defaultValue: 'Yes'
        }),
      queryInterface.addColumn('brands', 'platform_reporting',
        {
          type: Sequelize.ENUM('Yes', 'No'),
          defaultValue: 'Yes'
        }),
      queryInterface.addColumn('brands', 'platform_training',
        {
          type: Sequelize.ENUM('Yes', 'No'),
          defaultValue: 'Yes'
        }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('brands');
     */
    return Promise.all([
      queryInterface.removeColumn('brands', 'status'),
      queryInterface.removeColumn('brands', 'start_date'),
      queryInterface.removeColumn('brands', 'end_date'),
      queryInterface.removeColumn('brands', 'module_info'),
      queryInterface.removeColumn('brands', 'module_sales'),
      queryInterface.removeColumn('brands', 'module_actions'),
      queryInterface.removeColumn('brands', 'platform_photos'),
      queryInterface.removeColumn('brands', 'platform_reporting'),
      queryInterface.removeColumn('brands', 'platform_training'),
    ]);
  }
};
