'use strict';
const {
  Model
} = require('sequelize');

const status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

const model = (sequelize, DataTypes) => {
  class BrandPromosPos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BrandPromosPos.init({
    brandPromosId: DataTypes.INTEGER,
    posId: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM({
        values: Object.values(status)
      }),
    },
  }, {
    sequelize,
    modelName: 'brand_promos_pos',
  });
  return BrandPromosPos;
}

module.exports = {
  model,
  status,
}