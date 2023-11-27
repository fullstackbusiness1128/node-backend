'use strict';
const {
  Model
} = require('sequelize');

const status = {
  PENDINGAPPROVAL: "Pendiente Aprobación",
  INCIDENCE: "Incidencia",
  APPROVED: "Aprobado"
};

const holidayTypes = {
  VACATION: "Vacaciones",
  PAIDLEAVE: "Permiso Retribuido",
};

const paidTypes = {
  MARRIAGE: "Matrimonio",
  BIRTHORADOPTIONOFCHILD: "Nacimiento o adopción de hijo",
  CHANGEHABITUALADDRESS: "Cambio domicilio habitual",
  MARRIEDRELATIVES: "Matrimonio parientes hasta 2º grado",
  DEATHILLNESSHOSPITALFAMILY: "Fallecimiento, enfermedad grave, hospitalización o intervención de familiar hasta 2º grado",
};

const model = (sequelize, DataTypes) => {
  class holiday extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  holiday.init({
    userId: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    startDate: DataTypes.DATEONLY,
    endDate: DataTypes.DATEONLY,
    publicholiday_municipality: DataTypes.STRING,
    employee_comments: DataTypes.TEXT,
    responsible_comments: DataTypes.TEXT,
    approverId: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM({
        values: Object.keys(status)
      }),
    },
    holidayType: {
      type: DataTypes.ENUM({
        values: Object.keys(holidayTypes)
      }),
    },
    paidType: {
      type: DataTypes.ENUM({
        values: Object.keys(paidTypes)
      }),
    },
  }, {
    sequelize,
    modelName: 'holiday',
  });
  return holiday;
};

module.exports = {
  model,
  status,
  holidayTypes,
  paidTypes
}