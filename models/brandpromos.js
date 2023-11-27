'use strict';
const {
  Model
} = require('sequelize');

const status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

const model = (sequelize, DataTypes) => {
  class BrandPromos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BrandPromos.init({
    brandId: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    startDate: DataTypes.DATEONLY,
    endDate: DataTypes.DATEONLY,
    status: {
      type: DataTypes.ENUM({
        values: Object.values(status)
      }),
    },
    pdfFile: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'brand_promos',
  });
  return BrandPromos;
}

module.exports = {
  model,
  status,
}