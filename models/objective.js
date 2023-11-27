'use strict';
const {
  Model
} = require('sequelize');

const objective_types = {
  Info: 'Info',
  Sales: 'Sales',
  Actions: 'Actions',
}

const status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

const salesTypes = {
  ABSOLUTE: "Absolute",
  GROWTH_LAST_YEAR: "Growth Last Year",
  GROWTH_LAST_MONTH: "Growth Last Month",
  GROWTH_LAST_VISIT: "Growth Last Visit",
}

module.exports = (sequelize, DataTypes) => {
  class objective extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  objective.init({
    name: DataTypes.STRING,
    types: {
      type: DataTypes.ENUM({
        values: Object.values(objective_types)
      }),
    },
    brandId: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    weight: DataTypes.INTEGER,
    value: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM({
        values: Object.values(status)
      }),
    },
    start_date: {
      type: DataTypes.DATE,
    },
    end_date: {
      type: DataTypes.DATE,
    },
    salesTypes: {
      type: DataTypes.ENUM({
        values: Object.keys(salesTypes)
      }),
    },
  }, {
    sequelize,
    modelName: 'objective',
  });
  return objective;
};