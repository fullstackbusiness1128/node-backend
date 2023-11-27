'use strict';
const {
  Model
} = require('sequelize');

const logTypes = {
  WORK: "Trabajo",
  PAUSE: "Pausa"
};

const deviceTypes = {
  PC: "PC",
  MOBILE: "MOBILE"
};

const endStatus = {
  YES: "Yes",
  NO: "No"
};

const model = (sequelize, DataTypes) => {
  class workday extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  workday.init({
    userId: DataTypes.INTEGER,
    indexNum: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    startMoment: DataTypes.DATE,
    endMoment: DataTypes.DATE,
    endableMoment: DataTypes.DATE,
    logType: {
      type: DataTypes.ENUM({
        values: Object.keys(logTypes)
      }),
    },
    ipAddress: DataTypes.STRING,
    deviceType: {
      type: DataTypes.ENUM({
        values: Object.keys(deviceTypes)
      }),
    },
    deviceInformation: DataTypes.JSON,
    geoLatitude: DataTypes.STRING,
    geoLongitude: DataTypes.STRING,
    endStatus: {
      type: DataTypes.ENUM({
        values: Object.keys(endStatus)
      }),
    },
  }, {
    sequelize,
    modelName: 'workday',
  });
  return workday;
}

module.exports = {
  model,
  logTypes,
  deviceTypes,
  endStatus
}