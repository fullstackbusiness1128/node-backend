'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class objective_accomplishment_scales extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  objective_accomplishment_scales.init({
    objectiveId: DataTypes.INTEGER,
    orderNum: DataTypes.INTEGER,
    fromValue: DataTypes.INTEGER,
    toValue: DataTypes.INTEGER,
    accomplishedValue: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'objective_accomplishment_scales',
  });
  return objective_accomplishment_scales;
};