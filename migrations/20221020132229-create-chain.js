'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chains', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      parentId: {
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.TEXT
      },
      tree_path: {
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
    await queryInterface.addConstraint('chains', {
      fields: ['parentId'],
      type: 'foreign key',
      name: 'chains_parentId_fkey',
      references: {
        table: 'chains',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('chains', 'chains_parentId_fkey');
    await queryInterface.dropTable('chains');
  }
};