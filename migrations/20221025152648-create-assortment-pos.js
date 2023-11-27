'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assortment_pos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      assortmentId: {
        type: Sequelize.INTEGER
      },
      posId: {
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
    await queryInterface.addConstraint('assortment_pos', {
      fields: ['assortmentId'],
      type: 'foreign key',
      name: 'assortment_pos_assortmentId_fkey',
      references: {
        table: 'assortments',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('assortment_pos', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'assortment_pos_posId_fkey',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('assortment_pos', 'assortment_pos_posId_fkey');
    await queryInterface.removeConstraint('assortment_pos', 'assortment_pos_assortmentId_fkey');
    await queryInterface.dropTable('assortment_pos');
  }
};