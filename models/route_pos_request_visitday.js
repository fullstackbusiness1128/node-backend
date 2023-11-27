'use strict';
const {
  Model
} = require('sequelize');
const _ = require('lodash')

//day of the week, with Sunday as 0 and Saturday as 6.
const DAYS_ARR = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] // as appearing in database

const DAYS_DICT = DAYS_ARR.reduce((prev, dayStr, idx) => {
    prev[dayStr] = idx
    return prev
}, {})

const weekGetter = (self, prop) => {
    let ret = [null, null, null, null, null, null, null] //days of week
    const storedValue = self.getDataValue(prop);
    if (storedValue) {
        try {
            storedValue.trim().split(',').forEach(day => ret[DAYS_DICT[day.trim().toUpperCase()]] = true)
        } catch (ex) {
            console.error(ex)
        }
    }
    return ret
}

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
  class route_pos_request_visitday extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  route_pos_request_visitday.init({
    date: DataTypes.DATEONLY,
    userId: DataTypes.INTEGER,
    routeId: DataTypes.INTEGER,
    posId: DataTypes.INTEGER,
    w1: DataTypes.STRING,
    w2: DataTypes.STRING,
    w3: DataTypes.STRING,
    w4: DataTypes.STRING,
    // w1: {
    //   type: DataTypes.STRING,
    //   get() {
    //       return weekGetter(this, 'w1')
    //   }
    // },
    // w2: {
    //   type: DataTypes.STRING,
    //   get() {
    //       return weekGetter(this, 'w2')
    //   }
    // },
    // w3: {
    //   type: DataTypes.STRING,
    //   get() {
    //       return weekGetter(this, 'w3')
    //   }
    // },
    // w4: {
    //   type: DataTypes.STRING,
    //   get() {
    //       return weekGetter(this, 'w4')
    //   }
    // },
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
    modelName: 'route_pos_request_visitday',
  });
  return route_pos_request_visitday;
}

module.exports = {
  model,
  responsableApprovalStatus,
  adminApprovalStatus,
}