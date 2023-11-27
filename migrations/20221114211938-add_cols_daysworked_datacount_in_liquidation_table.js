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
      queryInterface.addColumn('liquidations', 'kmDaysWorked',
        {
          type: Sequelize.INTEGER,
          after: "expense_pending_approval",
          defaultValue: 0,
        }),
      queryInterface.addColumn('liquidations', 'kmDataCount',
        {
          type: Sequelize.INTEGER,
          after: "expense_pending_approval",
          defaultValue: 0,
        }),
      queryInterface.addColumn('liquidations', 'otherExpensesDaysWorked',
        {
          type: Sequelize.INTEGER,
          after: "expense_pending_approval",
          defaultValue: 0,
        }),
      queryInterface.addColumn('liquidations', 'otherExpensesDataCount',
        {
          type: Sequelize.INTEGER,
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
      queryInterface.removeColumn('liquidations', 'otherExpensesDataCount'),
      queryInterface.removeColumn('liquidations', 'otherExpensesDaysWorked'),
      queryInterface.removeColumn('liquidations', 'kmDataCount'),
      queryInterface.removeColumn('liquidations', 'kmDaysWorked'),
    ])
  }
};
