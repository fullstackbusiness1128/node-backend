'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pos_attachments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      posId: {
        type: Sequelize.INTEGER
      },
      attachmentId: {
        type: Sequelize.INTEGER
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
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
    await queryInterface.addConstraint('pos_attachments', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'pos_attachments_fk_posId',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('pos_attachments', {
      fields: ['attachmentId'],
      type: 'foreign key',
      name: 'pos_attachments_fk_attachmentId',
      references: {
        table: 'statics',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('pos_attachments', 'pos_attachments_fk_attachmentId');
    await queryInterface.removeConstraint('pos_attachments', 'pos_attachments_fk_posId');
    await queryInterface.dropTable('pos_attachments');
  }
};