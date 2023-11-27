'use strict';
const {
  Model
} = require('sequelize');

const closeStatus = {
  OPENED: "Abierta",
  CLOSED: "Cerrada"
};

const approvalStatus = {
  REGISTERED: "Registrada",
  INCIDENCE: "Incidencia",
  APPROVED: "Aprobado"
};

const model = (sequelize, DataTypes) => {
  class leave extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  leave.init({
    userId: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    startDate: DataTypes.DATEONLY,
    endDate: DataTypes.DATEONLY,
    publicholiday_municipality: DataTypes.STRING,
    documentId: DataTypes.INTEGER,
    closeStatus: {
      type: DataTypes.ENUM({
        values: Object.keys(closeStatus)
      }),
    },
    next_review_date: DataTypes.DATEONLY,
    employee_comments: DataTypes.TEXT,
    responsible_comments: DataTypes.TEXT,
    approverId: DataTypes.INTEGER,
    approvalStatus: {
      type: DataTypes.ENUM({
        values: Object.keys(approvalStatus)
      }),
    },
  }, {
    sequelize,
    modelName: 'leave',
  });
  return leave;
}

module.exports = {
  model,
  approvalStatus,
  closeStatus,
}