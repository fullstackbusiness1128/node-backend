'use strict';
const {
  Model
} = require('sequelize');

const reasonTypes = {
  CLOSINGBUSINESS: "Cierre Negocio",
  DONTWORKCATEGORY: "No Trabaja la categoría",
  SERVICEPROBLEMS: "Problemas Servicio",
  PRICEPRODUCTROTATION: "Precio / Rotación producto",
  OTHERS: "Otros"
};

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
  class route_pos_inactive extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  route_pos_inactive.init({
    date: DataTypes.DATEONLY,
    userId: DataTypes.INTEGER,
    routeId: DataTypes.INTEGER,
    posId: DataTypes.INTEGER,
    reasonType: {
      type: DataTypes.ENUM({
        values: Object.keys(reasonTypes)
      }),
    },
    gpvComments: DataTypes.TEXT,
    photoId: DataTypes.INTEGER,
    responsableApprovalStatus: {
      type: DataTypes.ENUM({
        values: Object.keys(responsableApprovalStatus)
      }),
    },
    responsableComments: DataTypes.TEXT,
    responsableId: DataTypes.INTEGER,
    adminApprovalStatus: {
      type: DataTypes.ENUM({
        values: Object.keys(adminApprovalStatus)
      }),
    },
    adminComments: DataTypes.TEXT,
    adminId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'route_pos_inactive',
  });
  return route_pos_inactive;
}

module.exports = {
  model,
  reasonTypes,
  responsableApprovalStatus,
  adminApprovalStatus,
}