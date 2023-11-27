'use strict';
const {
  Model
} = require('sequelize');

const model = (sequelize, DataTypes) => {
  class company extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  company.init({
    name: DataTypes.STRING,
    codeNum: DataTypes.INTEGER,
    vatCode: DataTypes.STRING,
    docTemplateName: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'company',
  });
  return company;
}

module.exports = {
  model,
}