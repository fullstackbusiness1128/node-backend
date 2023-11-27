'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('pos', 'addressObservation',
      {
        type: Sequelize.STRING,
      });
    await queryInterface.addColumn('pos', 'email',
      {
        type: Sequelize.STRING,
      });
    await queryInterface.addColumn('pos', 'fiscalName',
      {
        type: Sequelize.STRING,
      });
    await queryInterface.addColumn('pos', 'vatNumber',
      {
        type: Sequelize.STRING,
      });
    await queryInterface.addColumn('pos', 'fiscalTown',
      {
        type: Sequelize.STRING,
      });
    await queryInterface.addColumn('pos', 'fiscalPostalCode',
      {
        type: Sequelize.STRING,
      });
    await queryInterface.addColumn('pos', 'fiscalAddress',
      {
        type: Sequelize.STRING,
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('pos', 'fiscalAddress');
    await queryInterface.removeColumn('pos', 'fiscalPostalCode');
    await queryInterface.removeColumn('pos', 'fiscalTown');
    await queryInterface.removeColumn('pos', 'vatNumber');
    await queryInterface.removeColumn('pos', 'fiscalName');
    await queryInterface.removeColumn('pos', 'email');
    await queryInterface.removeColumn('pos', 'addressObservation');
  }
};
