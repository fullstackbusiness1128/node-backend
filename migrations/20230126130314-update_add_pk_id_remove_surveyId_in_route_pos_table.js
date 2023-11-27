'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeConstraint('route_pos', 'route_pos_ibfk_1');
    await queryInterface.removeConstraint('route_pos', 'route_pos_ibfk_2');
    await queryInterface.removeConstraint('route_pos', 'route_pos_ibfk_3');
    await queryInterface.removeConstraint('route_pos', 'PRIMARY');
    await queryInterface.addConstraint('route_pos', {
      fields: ['routeId'],
      type: 'foreign key',
      name: 'route_pos_ibfk_1',
      references: {
        table: 'routes',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'route_pos_ibfk_2',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'route_pos_ibfk_3',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.removeConstraint('route_pos', 'route_pos_surveyId_fkey');
    await queryInterface.removeColumn('route_pos', 'surveyId');
    await queryInterface.addColumn('route_pos', 'id',
      {
        type: Sequelize.INTEGER,
        first: true,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('route_pos', 'id');
    await queryInterface.addColumn('route_pos', 'surveyId',
      {
        type: Sequelize.INTEGER,
        after: "brandId",
      });
    await queryInterface.addConstraint('route_pos', {
      fields: ['surveyId'],
      type: 'foreign key',
      name: 'route_pos_surveyId_fkey',
      references: {
        table: 'surveys',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos', {
      fields: ['routeId', 'posId', 'brandId'],
      type: 'primary key',
    });
  }
};
