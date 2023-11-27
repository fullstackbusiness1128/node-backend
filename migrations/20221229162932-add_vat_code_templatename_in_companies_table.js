'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('companies', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('companies', 'docTemplateName',
      {
        type: Sequelize.STRING,
        after: "name",
      });
    await queryInterface.addColumn('companies', 'vatCode',
      {
        type: Sequelize.STRING,
        after: "name",
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('companies');
     */
    await queryInterface.removeColumn('companies', 'docTemplateName');
    await queryInterface.removeColumn('companies', 'vatCode');
  }
};
