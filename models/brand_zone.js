'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class brand_zone extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  brand_zone.init({
    zoneId: DataTypes.INTEGER,
    brandId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'brand_zone',
  });
  return brand_zone;
};