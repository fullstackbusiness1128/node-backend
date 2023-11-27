'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class assortment_pos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  assortment_pos.init({
    assortmentId: DataTypes.INTEGER,
    posId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'assortment_pos',
  });
  return assortment_pos;
};