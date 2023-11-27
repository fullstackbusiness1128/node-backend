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
      queryInterface.changeColumn('liquidations', 'status',
        {
          type: Sequelize.ENUM('Pdte Aprob Gastos', 'Pdte Firma Empleado', 'Pdte Firma Responsable', 'Incidencia', 'Aprobada'),
          defaultValue: 'Pdte Aprob Gastos'
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
      queryInterface.changeColumn('liquidations', 'status',
        {
          type: Sequelize.ENUM('PendingExpenses', 'PendingGPVSignature', 'PendingApproval', 'LiquidationIncidence', 'LiquidationAproved'),
          defaultValue: 'PendingExpenses'
        }),
    ])
  }
};
