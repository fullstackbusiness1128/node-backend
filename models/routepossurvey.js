'use strict';
const {
  Model
} = require('sequelize');

const model = (sequelize, DataTypes) => {
  class routePosSurvey extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  routePosSurvey.init({
    routePosId: DataTypes.INTEGER,
    surveyId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'route_pos_surveys',
  });
  return routePosSurvey;
}

module.exports = {
  model,
}
