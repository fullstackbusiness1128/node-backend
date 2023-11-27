'use strict';
const {
  Model
} = require('sequelize');
const status = [
  // 'PendingExpenses', 'PendingGPVSignature', 'PendingApproval', 'LiquidationIncidence', 'LiquidationAproved'
  'Pdte Aprob Gastos', 'Pdte Firma Empleado', 'Pdte Firma Responsable', 'Incidencia', 'Aprobada'
];
module.exports = (sequelize, DataTypes) => {
  class liquidation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  liquidation.init({
    year: DataTypes.INTEGER,
    month: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    attachment_document: DataTypes.INTEGER,
    responsable_sign_document: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM({
        values: Object.values(status)
      }),
    },
    approverId: DataTypes.INTEGER,
    gpv_comment: DataTypes.TEXT,
    spv_comment: DataTypes.TEXT,
    km_total: DataTypes.FLOAT,
    km_incidence_total: DataTypes.FLOAT,
    km_pending_approval: DataTypes.FLOAT,
    expense_total: DataTypes.FLOAT,
    expense_incidence_total: DataTypes.FLOAT,
    expense_pending_approval: DataTypes.FLOAT,
    food_total: DataTypes.FLOAT,
    transport_total: DataTypes.FLOAT,
    lodgment_total: DataTypes.FLOAT,
    otherexpenses_total: DataTypes.FLOAT,
    otherExpensesDataCount: DataTypes.INTEGER,
    otherExpensesDaysWorked: DataTypes.INTEGER,
    kmDataCount: DataTypes.INTEGER,
    kmDaysWorked: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'liquidation',
  });
  return liquidation;
};