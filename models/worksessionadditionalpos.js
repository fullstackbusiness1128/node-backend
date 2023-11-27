'use strict';
const {
  Model
} = require('sequelize');

const model = (sequelize, DataTypes) => {
  class worksessionAdditionalPos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  worksessionAdditionalPos.init({
    // worksessionId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    routeId: DataTypes.INTEGER,
    posId: DataTypes.INTEGER,
    brandId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'worksessionadditionalpos',
  });
  return worksessionAdditionalPos;
}

module.exports = {
  model,
}