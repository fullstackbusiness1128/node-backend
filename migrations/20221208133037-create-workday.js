'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workdays', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      index: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      date: {
        type: Sequelize.DATE
      },
      startMoment: {
        type: Sequelize.DATE
      },
      endMoment: {
        type: Sequelize.DATE
      },
      logType: {
        type: Sequelize.ENUM('WORK', 'PAUSE'),
        defaultValue: 'WORK'
      },
      ipAddress: {
        type: Sequelize.STRING,
        defaultValue: "0.0.0.0"
      },
      deviceType: {
        type: Sequelize.ENUM('PC', 'MOBILE'),
        defaultValue: 'PC'
      },
      deviceInformation: {
        type: Sequelize.JSON,
      },
      geoLatitude: {
        type: Sequelize.STRING,
        defaultValue: "0"
      },
      geoLongitude: {
        type: Sequelize.STRING,
        defaultValue: "0"
      },
      endStatus: {
        type: Sequelize.ENUM('YES', 'NO'),
        defaultValue: 'YES'
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
    await queryInterface.addConstraint('workdays', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'workdays_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('workdays', 'workdays_userId_fkey');
    await queryInterface.dropTable('workdays');
  }
};