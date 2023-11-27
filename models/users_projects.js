'use strict';
const {
  Model
} = require('sequelize');

const model = (sequelize, DataTypes) => {
  class users_projects extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  users_projects.init({
    userId: DataTypes.INTEGER,
    brandId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'users_projects',
  });
  return users_projects;
}

module.exports = {
  model,
}