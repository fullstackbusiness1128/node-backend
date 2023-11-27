'use strict';
const {
  Model
} = require('sequelize');

const responsableApprovalStatus = {
  PENDING: "Pendiente",
  INCIDENCE: "Not OK",
  APPROVED: "OK"
};

const adminApprovalStatus = {
  PENDING: "Pendiente",
  INCIDENCE: "Not OK",
  APPROVED: "OK"
};

const model = (sequelize, DataTypes) => {
  class pos_new_request extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  pos_new_request.init({
    userId: DataTypes.INTEGER,
    routeId: DataTypes.INTEGER,
    posId: DataTypes.INTEGER,
    gpvComments: DataTypes.TEXT,
    responsableId: DataTypes.INTEGER,
    responsableApprovalStatus: {
      type: DataTypes.ENUM({
        values: Object.keys(responsableApprovalStatus)
      }),
    },
    responsableComments: DataTypes.TEXT,
    adminId: DataTypes.INTEGER,
    adminApprovalStatus: {
      type: DataTypes.ENUM({
        values: Object.keys(adminApprovalStatus)
      }),
    },
    adminComments: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'pos_new_request',
  });
  return pos_new_request;
}

module.exports = {
  model,
  responsableApprovalStatus,
  adminApprovalStatus,
}