'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class pro_sub_brands extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  pro_sub_brands.init({
    pro_id: DataTypes.INTEGER,
    sub_brand_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'pro_sub_brands',
  });
  return pro_sub_brands;
};