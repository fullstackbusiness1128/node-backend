'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubBrands extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SubBrands.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    brandId: DataTypes.INTEGER,
    parentId: DataTypes.INTEGER,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'subbrands',
  });
  return SubBrands;
};