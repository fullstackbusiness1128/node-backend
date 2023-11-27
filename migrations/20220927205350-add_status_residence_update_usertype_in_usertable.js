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
      queryInterface.addColumn('users', 'residence',
        {
          type: Sequelize.STRING
        }),
      queryInterface.addColumn('users', 'status',
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
     * await queryInterface.dropTable('users');
     */
    return Promise.all([
      queryInterface.removeColumn('users', 'residence'),
      queryInterface.removeColumn('users', 'status'),
    ]);
  }
};
