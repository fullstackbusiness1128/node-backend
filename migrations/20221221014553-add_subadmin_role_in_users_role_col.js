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
      queryInterface.changeColumn('users', 'role', {
        type: Sequelize.ENUM('admin', 'subadmin', 'staff', 'brand', 'manager', 'spv', 'gpv'),
        defaultValue: 'gpv'
      })
    ])
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return Promise.all([
      queryInterface.changeColumn('users', 'role', {
        type: Sequelize.ENUM('admin', 'staff', 'brand', 'manager', 'spv', 'gpv'),
        defaultValue: 'gpv'
      })
    ])
  }
};
