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
      queryInterface.changeColumn('expense_kilometers', 'approvalStatus',
        {
          type: Sequelize.ENUM('Pendiente Aprobación', 'Incidencia', 'Aprobado'),
          defaultValue: 'Pendiente Aprobación'
        }),
      queryInterface.changeColumn('expense_others', 'approvalStatus',
        {
          type: Sequelize.ENUM('Pendiente Aprobación', 'Incidencia', 'Aprobado'),
          defaultValue: 'Pendiente Aprobación'
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
      queryInterface.changeColumn('expense_kilometers', 'approvalStatus',
        {
          type: Sequelize.ENUM('Pendiente', 'Pendiente Aprobación', 'Incidencia', 'Aprobado'),
          defaultValue: 'Pendiente'
        }),
      queryInterface.changeColumn('expense_others', 'approvalStatus',
        {
          type: Sequelize.ENUM('Pendiente', 'Pendiente Aprobación', 'Incidencia', 'Aprobado'),
          defaultValue: 'Pendiente'
        }),
    ])
  }
};
