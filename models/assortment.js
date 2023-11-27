'use strict';
const {
  Model
} = require('sequelize');

const status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

const yn_type = ['Yes', 'No'];

module.exports = (sequelize, DataTypes) => {
  class Assortment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Assortment.init({
    name: DataTypes.STRING,
    brand_id: DataTypes.INTEGER,
    // product_id: DataTypes.INTEGER,
    operator_id: DataTypes.INTEGER,
    id_product_operator: DataTypes.STRING,
    unit_price_without_vat: DataTypes.DECIMAL,
    returns_accepted: {            
        type: DataTypes.ENUM({
            values:  Object.values(yn_type)
        }),
    },
    returns_max: DataTypes.DECIMAL,
    priority_label: DataTypes.INTEGER,
    priority_1: {            
        type: DataTypes.ENUM({
            values:  Object.values(yn_type)
        }),
    },
    priority_2: {            
        type: DataTypes.ENUM({
            values:  Object.values(yn_type)
        }),
    },
    novelty: {            
        type: DataTypes.ENUM({
            values:  Object.values(yn_type)
        }),
    },
    status: {            
        type: DataTypes.ENUM({
            values:  Object.values(status)
        }),
    },
  }, {
    sequelize,
    modelName: 'assortment',
  });
  return Assortment;
};