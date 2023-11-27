'use strict';
const {
  Model
} = require('sequelize');
const model = (sequelize, DataTypes) => {
  class route_pos_request_visitday_brands extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  route_pos_request_visitday_brands.init({
    routePosRequestVisitdayId: DataTypes.INTEGER,
    brandId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'route_pos_request_visitday_brands',
  });
  return route_pos_request_visitday_brands;
}

module.exports = {
  model,
}