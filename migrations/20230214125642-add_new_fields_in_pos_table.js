'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('pos', 'isNotRequested',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });
    await queryInterface.addColumn('pos', 'isRequestApproved',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('pos', 'isRequestApproved');
    await queryInterface.removeColumn('pos', 'isNotRequested');
  }
};
