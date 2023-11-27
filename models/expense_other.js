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
  class expense_other extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  expense_other.init({
    date: DataTypes.DATE,
    userId: DataTypes.INTEGER,
    routeId: DataTypes.INTEGER,
    expenseTypeId: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    amount: DataTypes.FLOAT,
    document: DataTypes.INTEGER,
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
    modelName: 'expense_other',
  });
  return expense_other;
};