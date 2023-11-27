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
      queryInterface.addColumn('liquidations', 'food_total',
        {
          type: Sequelize.FLOAT,
          after: "expense_pending_approval",
          defaultValue: 0,
        }),
      queryInterface.addColumn('liquidations', 'transport_total',
        {
          type: Sequelize.FLOAT,
          after: "expense_pending_approval",
          defaultValue: 0,
        }),
      queryInterface.addColumn('liquidations', 'lodgment_total',
        {
          type: Sequelize.FLOAT,
          after: "expense_pending_approval",
          defaultValue: 0,
        }),
      queryInterface.addColumn('liquidations', 'otherexpenses_total',
        {
          type: Sequelize.FLOAT,
          after: "expense_pending_approval",
          defaultValue: 0,
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
      queryInterface.removeColumn('liquidations', 'otherexpenses_total'),
      queryInterface.removeColumn('liquidations', 'lodgment_total'),
      queryInterface.removeColumn('liquidations', 'transport_total'),
      queryInterface.removeColumn('liquidations', 'food_total'),
    ])
  }
};
