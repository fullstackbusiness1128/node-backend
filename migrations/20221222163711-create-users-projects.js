'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users_projects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      brandId: {
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
    await queryInterface.addConstraint('users_projects', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'users_projects_brandId_fkey',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('users_projects', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'users_projects_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('users_projects', 'users_projects_userId_fkey');
    await queryInterface.removeConstraint('users_projects', 'users_projects_brandId_fkey');
    await queryInterface.dropTable('users_projects');
  }
};