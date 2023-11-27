'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeColumn('users', 'company');
    await queryInterface.addColumn('users', 'companyCode',
      {
        type: Sequelize.INTEGER,
      });
    await queryInterface.addConstraint('users', {
      fields: ['companyCode'],
      type: 'foreign key',
      name: 'users_companyCode_fkey',
      references: {
        table: 'companies',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('users', 'users_companyCode_fkey');
    await queryInterface.addColumn('users', 'company',
      {
        type: Sequelize.STRING,
      });
    await queryInterface.removeColumn('users', 'companyCode');
  }
};
