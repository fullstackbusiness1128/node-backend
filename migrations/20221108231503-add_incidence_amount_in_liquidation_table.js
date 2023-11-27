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
      queryInterface.addColumn('liquidations', 'km_incidence_total',
        {
          type: Sequelize.FLOAT,
          after: "km_total",
        }),
      queryInterface.addColumn('liquidations', 'expense_incidence_total',
        {
          type: Sequelize.FLOAT,
          after: "expense_total",
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
      queryInterface.removeColumn('liquidations', 'expense_incidence_total'),
      queryInterface.removeColumn('liquidations', 'km_incidence_total'),
    ])
  }
};
