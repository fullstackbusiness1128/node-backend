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
      queryInterface.addColumn('users', 'email',
        {
          type: Sequelize.STRING,
        }),
      queryInterface.addColumn('users', 'phone',
        {
          type: Sequelize.STRING,
        }),
      queryInterface.addColumn('users', 'dni',
        {
          type: Sequelize.STRING,
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
      queryInterface.removeColumn('users', 'dni'),
      queryInterface.removeColumn('users', 'phone'),
      queryInterface.removeColumn('users', 'email'),
    ])
  }
};
