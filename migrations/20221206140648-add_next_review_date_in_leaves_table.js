'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('leaves', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('leaves', 'next_review_date',
      {
        type: Sequelize.DATEONLY,
        after: "closeStatus",
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('leaves');
     */
    await queryInterface.removeColumn('leaves', 'next_review_date');
  }
};
