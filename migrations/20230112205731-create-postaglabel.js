'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('postaglabels', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      brandId: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
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
    await queryInterface.addConstraint('postaglabels', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'postaglabels_brandId_fkey',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('postaglabels', 'postaglabels_brandId_fkey');
    await queryInterface.dropTable('postaglabels');
  }
};