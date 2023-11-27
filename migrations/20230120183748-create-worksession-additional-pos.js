'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('worksessionadditionalpos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      worksessionId: {
        type: Sequelize.INTEGER
      },
      routeId: {
        type: Sequelize.INTEGER
      },
      posId: {
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
    await queryInterface.addConstraint('worksessionadditionalpos', {
      fields: ['worksessionId'],
      type: 'foreign key',
      name: 'fkey_wap_worksessionId',
      references: {
        table: 'worksessions',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('worksessionadditionalpos', {
      fields: ['routeId'],
      type: 'foreign key',
      name: 'fkey_wap_routeId',
      references: {
        table: 'routes',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('worksessionadditionalpos', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'fkey_wap_posId',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('worksessionadditionalpos', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'fkey_wap_brandId',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('worksessionadditionalpos', 'fkey_wap_brandId');
    await queryInterface.removeConstraint('worksessionadditionalpos', 'fkey_wap_posId');
    await queryInterface.removeConstraint('worksessionadditionalpos', 'fkey_wap_routeId');
    await queryInterface.removeConstraint('worksessionadditionalpos', 'fkey_wap_worksessionId');
    await queryInterface.dropTable('worksessionadditionalpos');
  }
};