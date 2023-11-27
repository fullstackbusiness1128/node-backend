'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class holidaypublic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  holidaypublic.init({
    holidayId: DataTypes.INTEGER,
    publicholiday: DataTypes.DATEONLY,
  }, {
    sequelize,
    modelName: 'holidaypublic',
  });
  return holidaypublic;
};