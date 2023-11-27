'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('holidaypaiddayslimits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      companyId: {
        type: Sequelize.INTEGER
      },
      paidType: {
        type: Sequelize.ENUM('MARRIAGE', 'BIRTHORADOPTIONOFCHILD', 'CHANGEHABITUALADDRESS', 'MARRIEDRELATIVES', 'DEATHILLNESSHOSPITALFAMILY'),
        defaultValue: 'MARRIAGE'
      },
      limitDays: {
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
    await queryInterface.addConstraint('holidaypaiddayslimits', {
      fields: ['companyId'],
      type: 'foreign key',
      name: 'holidaypaiddayslimits_companyId_fkey',
      references: {
        table: 'companies',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('holidaypaiddayslimits', 'holidaypaiddayslimits_companyId_fkey');
    await queryInterface.dropTable('holidaypaiddayslimits');
  }
};