'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class products_sub_brands extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  products_sub_brands.init({
    pro_id: DataTypes.INTEGER,
    brand_id: DataTypes.INTEGER,
    parent_brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tree_path: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'products_sub_brands',
  });
  return products_sub_brands;
};