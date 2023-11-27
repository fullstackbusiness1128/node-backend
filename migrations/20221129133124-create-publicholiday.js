'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('holidaypublics', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      holidayId: {
        type: Sequelize.INTEGER
      },
      publicholiday: {
        type: Sequelize.DATEONLY
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
    await queryInterface.addConstraint('holidaypublics', {
      fields: ['holidayId'],
      type: 'foreign key',
      name: 'holidaypublics_holidayId_fkey',
      references: {
        table: 'holidays',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('holidaypublics', 'holidaypublics_holidayId_fkey');
    await queryInterface.dropTable('holidaypublics');
  }
};