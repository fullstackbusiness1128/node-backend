'use strict';
const {
  Model
} = require('sequelize');

const model = (sequelize, DataTypes) => {
  class worksessionPosBrand extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  worksessionPosBrand.init({
    worksessionPosId: DataTypes.INTEGER,
    brandId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'worksession_pos_brands',
  });
  return worksessionPosBrand;
}

module.exports = {
  model,
}