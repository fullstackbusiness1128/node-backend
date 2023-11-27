'use strict';
const {
  Model
} = require('sequelize');

const status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

const model = (sequelize, DataTypes) => {
  class postaglabel extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  postaglabel.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    brandId: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM({
        values: Object.values(status)
      }),
    },
  }, {
    sequelize,
    modelName: 'postaglabel',
  });
  return postaglabel;
};

module.exports = {
  model,
  status,
}