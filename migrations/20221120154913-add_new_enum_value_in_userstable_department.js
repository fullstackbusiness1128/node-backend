'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('users', 'department',
      {
        type: Sequelize.ENUM('Ventas', 'RRHH', 'Finanzas', 'Trade', 'Operaciones', 'MKT', 'Proyectos'),
        defaultValue: 'Ventas'
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn('users', 'department',
      {
        type: Sequelize.ENUM('Ventas', 'RRHH', 'Finanzas', 'Trade', 'Operaciones', 'MKT'),
        defaultValue: 'Ventas'
      });
  }
};
