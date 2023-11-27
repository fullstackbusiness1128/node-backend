'use strict';
const {
  Model
} = require('sequelize');

const model = (sequelize, DataTypes) => {
  class staticpendingholidays extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staticpendingholidays.init({
    userId: DataTypes.INTEGER,
    appliedYear: DataTypes.INTEGER,
    pendingholidays: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'staticpendingholidays',
  });
  return staticpendingholidays;
}

module.exports = {
  model,
}