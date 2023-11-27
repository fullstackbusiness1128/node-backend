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
      queryInterface.addColumn('zones', 'geographyId',
        {
          type: Sequelize.INTEGER,
          after: "name",
        }),
      queryInterface.addConstraint('zones', {
        fields: ['geographyId'],
        type: 'foreign key',
        name: 'zones_geographyId_fkey',
        references: {
          table: 'geographies',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      })
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
      await queryInterface.removeConstraint('zones', 'zones_geographyId_fkey'),
      queryInterface.removeColumn('zones', 'geographyId'),
    ])
  }
};
