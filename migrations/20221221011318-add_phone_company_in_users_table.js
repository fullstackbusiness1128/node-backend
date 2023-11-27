'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.FLOAT });
     */
    return Promise.all([
      queryInterface.addColumn('users', 'phone_company',
        {
          type: Sequelize.STRING,
          after: "phone",
        }),
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
      queryInterface.removeColumn('users', 'phone_company'),
    ])
  }
};
