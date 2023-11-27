'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('holidaystaticdays', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      companyId: {
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      holidayType: {
        type: Sequelize.ENUM('FREELY', 'NATIONAL'),
        defaultValue: 'FREELY'
      },
      description: {
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
    await queryInterface.addConstraint('holidaystaticdays', {
      fields: ['companyId'],
      type: 'foreign key',
      name: 'holidaystaticdays_companyId_fkey',
      references: {
        table: 'companies',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('holidaystaticdays', 'holidaystaticdays_companyId_fkey');
    await queryInterface.dropTable('holidaystaticdays');
  }
};