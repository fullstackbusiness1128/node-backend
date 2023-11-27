'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class zone_geography extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  zone_geography.init({
    zoneId: DataTypes.INTEGER,
    geographyId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'zone_geography',
  });
  return zone_geography;
};