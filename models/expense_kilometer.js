'use strict';
const {
  Model
} = require('sequelize');
const approvalStatus = [
  'Pendiente Aprobación',
  'Incidencia',
  'Aprobado'
]
module.exports = (sequelize, DataTypes) => {
  class expense_kilometer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  expense_kilometer.init({
    date: DataTypes.DATE,
    userId: DataTypes.INTEGER,
    routeId: DataTypes.INTEGER,
    expenseTypeId: DataTypes.INTEGER,
    startKM: DataTypes.FLOAT,
    startPhotoId: DataTypes.INTEGER,
    endKM: DataTypes.FLOAT,
    endPhotoId: DataTypes.INTEGER,
    approvalStatus: {
      type: DataTypes.ENUM({
        values: Object.values(approvalStatus)
      }),
    },
    approverId: DataTypes.INTEGER,
    gpv_comment: DataTypes.TEXT,
    spv_comment: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'expense_kilometer',
  });
  return expense_kilometer;
};