'use strict';
const {
  Model
} = require('sequelize');

const sentStatus = {
  SENT: "SENT",
  SUCCESS: "SUCCESS"
};

const model = (sequelize, DataTypes) => {
  class emaillogs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  emaillogs.init({
    userId: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    emailType: DataTypes.INTEGER, // 1:NOTSTARTWORKING, 2:EXCEEDTIME
    sentStatus: {
      type: DataTypes.ENUM({
        values: Object.keys(sentStatus)
      }),
    },
  }, {
    sequelize,
    modelName: 'emaillogs',
  });
  return emaillogs;
}

module.exports = {
  model,
  sentStatus,
}