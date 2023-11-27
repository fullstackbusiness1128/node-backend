'use strict';
const {
  Model
} = require('sequelize');
const model = (sequelize, DataTypes) => {
  class pos_new_request_brands extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  pos_new_request_brands.init({
    posNewRequestedId: DataTypes.INTEGER,
    brandId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'pos_new_request_brands',
  });
  return pos_new_request_brands;
}

module.exports = {
  model,
}