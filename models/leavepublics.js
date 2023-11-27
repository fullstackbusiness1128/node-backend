'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class leavepublics extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  leavepublics.init({
    leaveId: DataTypes.INTEGER,
    publicholiday: DataTypes.DATEONLY
  }, {
    sequelize,
    modelName: 'leavepublics',
  });
  return leavepublics;
};