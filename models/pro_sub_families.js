'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class pro_sub_families extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  pro_sub_families.init({
    pro_id: DataTypes.INTEGER,
    sub_family_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'pro_sub_families',
  });
  return pro_sub_families;
};