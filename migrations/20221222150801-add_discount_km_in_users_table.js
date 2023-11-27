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
      queryInterface.addColumn('users', 'discount_km',
        {
          type: Sequelize.INTEGER,
          defaultValue: 0
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
      queryInterface.removeColumn('users', 'discount_km'),
    ])
  }
};
