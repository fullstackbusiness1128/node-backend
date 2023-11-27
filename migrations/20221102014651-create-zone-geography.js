'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('zone_geographies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      zoneId: {
        type: Sequelize.INTEGER
      },
      geographyId: {
        type: Sequelize.INTEGER
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
    await queryInterface.addConstraint('zone_geographies', {
      fields: ['zoneId'],
      type: 'foreign key',
      name: 'zone_geographies_zoneId_fkey',
      references: {
        table: 'zones',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('zone_geographies', {
      fields: ['geographyId'],
      type: 'foreign key',
      name: 'zone_geographies_geographyId_fkey',
      references: {
        table: 'geographies',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.removeConstraint('zones', 'zones_geographyId_fkey');
    await queryInterface.removeColumn('zones', 'geographyId');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('zones', 'geographyId',
      {
        type: Sequelize.INTEGER,
        after: "name",
      });
    await queryInterface.addConstraint('zones', {
      fields: ['geographyId'],
      type: 'foreign key',
      name: 'zones_geographyId_fkey',
      references: {
        table: 'geographies',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.removeConstraint('zone_geographies', 'zone_geographies_geographyId_fkey');
    await queryInterface.removeConstraint('zone_geographies', 'zone_geographies_zoneId_fkey');
    await queryInterface.dropTable('zone_geographies');
  }
};