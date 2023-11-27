'use strict';
const {
  Model
} = require('sequelize');

const paidTypes = {
  MARRIAGE: "Matrimonio",
  BIRTHORADOPTIONOFCHILD: "Nacimiento o adopción de hijo",
  CHANGEHABITUALADDRESS: "Cambio domicilio habitual",
  MARRIEDRELATIVES: "Matrimonio parientes hasta 2º grado",
  DEATHILLNESSHOSPITALFAMILY: "Fallecimiento, enfermedad grave, hospitalización o intervención de familiar hasta 2º grado",
};

const model = (sequelize, DataTypes) => {
  class holidaypaiddayslimit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  holidaypaiddayslimit.init({
    companyId: DataTypes.INTEGER,
    paidType: {
      type: DataTypes.ENUM({
        values: Object.keys(paidTypes)
      }),
    },
    limitDays: DataTypes.INTEGER,
    isNatural: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'holidaypaiddayslimit',
  });
  return holidaypaiddayslimit;
};

module.exports = {
  model,
  paidTypes
}

