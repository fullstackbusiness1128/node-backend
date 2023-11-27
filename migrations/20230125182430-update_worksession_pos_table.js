'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('worksession_pos', 'routeId',
      {
        type: Sequelize.INTEGER,
        after: "worksessionId",
      });
    await queryInterface.addConstraint('worksession_pos', {
      fields: ['routeId'],
      type: 'foreign key',
      name: 'worksession_pos_routeId_fkey',
      references: {
        table: 'routes',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addColumn('worksession_pos', 'brandId',
      {
        type: Sequelize.INTEGER,
        after: "posId",
      });
    await queryInterface.addConstraint('worksession_pos', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'worksession_pos_brandId_fkey',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
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
    await queryInterface.removeConstraint('worksession_pos', 'worksession_pos_brandId_fkey');
    await queryInterface.removeColumn('worksession_pos', 'brandId');
    await queryInterface.removeConstraint('worksession_pos', 'worksession_pos_routeId_fkey');
    await queryInterface.removeColumn('worksession_pos', 'routeId');
  }
};
