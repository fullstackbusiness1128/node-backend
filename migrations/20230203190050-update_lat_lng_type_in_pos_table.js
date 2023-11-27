'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('pos', 'latitude',
      {
        type: Sequelize.FLOAT,
      });
    await queryInterface.changeColumn('pos', 'longitude',
      {
        type: Sequelize.FLOAT,
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn('pos', 'latitude',
      {
        type: Sequelize.STRING,
      });
    await queryInterface.changeColumn('pos', 'longitude',
      {
        type: Sequelize.STRING,
      });
  }
};
