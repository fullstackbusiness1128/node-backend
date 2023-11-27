'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class objective_routes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  objective_routes.init({
    objectiveId: DataTypes.INTEGER,
    routeId: DataTypes.INTEGER,
    posCount: DataTypes.INTEGER,
    value: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'objective_routes',
  });
  return objective_routes;
};