'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('emaillogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      emailType: {
        type: Sequelize.INTEGER
      },
      sentStatus: {
        type: Sequelize.ENUM('SENT', 'SUCCESS'),
        defaultValue: 'SENT'
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('emaillogs');
  }
};