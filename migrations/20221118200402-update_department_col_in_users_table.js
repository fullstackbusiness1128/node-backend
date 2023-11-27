'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('users', 'department',
      {
        type: Sequelize.ENUM('Ventas', 'RRHH', 'Finanzas', 'Trade', 'Operaciones', 'MKT'),
        defaultValue: 'Ventas'
      });
    await queryInterface.removeConstraint('users', 'users_dep_id_fkey');
    await queryInterface.removeColumn('users', 'dep_id');
    await queryInterface.dropTable('departments');
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.createTable('departments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dep_name: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addColumn('users', 'dep_id',
      {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    await queryInterface.addConstraint('users', {
      fields: ['dep_id'],
      type: 'foreign key',
      name: 'users_dep_id_fkey',
      references: {
        table: 'departments',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.removeColumn('users', 'department');
  }
};
