'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class objective_pos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  objective_pos.init({
    objectiveId: DataTypes.INTEGER,
    posId: DataTypes.INTEGER,
    value: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'objective_pos',
  });
  return objective_pos;
};