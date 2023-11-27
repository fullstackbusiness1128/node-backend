'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('worksession_pos_brands', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      worksessionPosId: {
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
    await queryInterface.addConstraint('worksession_pos_brands', {
      fields: ['worksessionPosId'],
      type: 'foreign key',
      name: 'worksession_pos_brands_worksessionPosId_fkey',
      references: {
        table: 'worksession_pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('worksession_pos_brands', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'worksession_pos_brands_brandId_fkey',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('worksession_pos_brands', 'worksession_pos_brands_brandId_fkey');
    await queryInterface.removeConstraint('worksession_pos_brands', 'worksession_pos_brands_worksessionPosId_fkey');
    await queryInterface.dropTable('worksession_pos_brands');
  }
};