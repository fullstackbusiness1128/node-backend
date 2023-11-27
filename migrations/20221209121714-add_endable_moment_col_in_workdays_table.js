'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('workdays', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('workdays', 'endableMoment',
      {
        type: Sequelize.DATE,
        after: "endMoment",
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('workdays');
     */
    await queryInterface.removeColumn('workdays', 'endableMoment');
  }
};
