'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pos_new_request_brands', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      posNewRequestedId: {
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
    await queryInterface.addConstraint('pos_new_request_brands', {
      fields: ['posNewRequestedId'],
      type: 'foreign key',
      name: 'pnrb_fk_posNewRequestedId',
      references: {
        table: 'pos_new_requests',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('pos_new_request_brands', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'pnrb_fk_brandId',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('pos_new_request_brands', 'pnrb_fk_brandId');
    await queryInterface.removeConstraint('pos_new_request_brands', 'pnrb_fk_posNewRequestedId');
    await queryInterface.dropTable('pos_new_request_brands');
  }
};