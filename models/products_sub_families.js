'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class products_sub_families extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  products_sub_families.init({
    pro_id: DataTypes.INTEGER,
    family_id: DataTypes.INTEGER,
    parent_family_id: DataTypes.INTEGER,
    tree_path: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'products_sub_families',
  });
  return products_sub_families;
};