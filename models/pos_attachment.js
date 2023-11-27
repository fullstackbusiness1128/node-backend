'use strict';
const {
  Model
} = require('sequelize');

const model = (sequelize, DataTypes) => {
  class pos_attachment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  pos_attachment.init({
    posId: DataTypes.INTEGER,
    attachmentId: DataTypes.INTEGER,
    orderIndex: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'pos_attachment',
  });
  return pos_attachment;
};

module.exports = {
  model,
}