'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('brand_onepages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      brandId: {
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.TEXT
      },
      startDate: {
        type: Sequelize.DATEONLY
      },
      endDate: {
        type: Sequelize.DATEONLY
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      pdfFile: {
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
    await queryInterface.addConstraint('brand_onepages', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'bo_fk_brandId',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('brand_onepages', {
      fields: ['pdfFile'],
      type: 'foreign key',
      name: 'bo_fk_pdfFile',
      references: {
        table: 'statics',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('brand_onepages', 'bo_fk_pdfFile');
    await queryInterface.removeConstraint('brand_onepages', 'bo_fk_brandId');
    await queryInterface.dropTable('brand_onepages');
  }
};