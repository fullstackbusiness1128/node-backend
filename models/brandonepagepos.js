'use strict';
const {
  Model
} = require('sequelize');

const status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

const model = (sequelize, DataTypes) => {
  class BrandOnepagePos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BrandOnepagePos.init({
    brandOnePageId: DataTypes.INTEGER,
    posId: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM({
        values: Object.values(status)
      }),
    },
  }, {
    sequelize,
    modelName: 'brand_onepage_pos',
  });
  return BrandOnepagePos;
}

module.exports = {
  model,
  status,
}
