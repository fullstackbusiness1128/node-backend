'use strict';
const {
  Model
} = require('sequelize');

const model = (sequelize, DataTypes) => {
  class pos_tags extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  pos_tags.init({
    labelId: DataTypes.INTEGER,
    posId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'pos_tags',
  });
  return pos_tags;
};

module.exports = {
  model,
}
