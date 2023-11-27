'use strict';
const {
  Model
} = require('sequelize');

const model = (sequelize, DataTypes) => {
  class posbrands extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  posbrands.init({
    id: {
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER
    },
    posId: DataTypes.INTEGER,
    brandId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'posbrands',
  });
  return posbrands;
};

module.exports = {
  model,
}
