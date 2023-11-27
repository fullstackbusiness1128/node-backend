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
      queryInterface.addColumn('users', 'start_date',
        {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        }),
      queryInterface.addColumn('users', 'end_date',
        {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        }),
      queryInterface.addColumn('users', 'project',
        {
          type: Sequelize.STRING
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
      queryInterface.removeColumn('users', 'project'),
      queryInterface.removeColumn('users', 'end_date'),
      queryInterface.removeColumn('users', 'start_date'),
    ]);
  }
};
