'use strict';
const {
  Model
} = require('sequelize');

const holidayTypes = {
  FREELY: "Libre disposición",
  NATIONAL: "Festivo Nacional",
};

const model = (sequelize, DataTypes) => {
  class holidaystaticdays extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  holidaystaticdays.init({
    companyId: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    holidayType: {
      type: DataTypes.ENUM({
        values: Object.keys(holidayTypes)
      }),
    },
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'holidaystaticdays',
  });
  return holidaystaticdays;
};

module.exports = {
  model,
  holidayTypes
}