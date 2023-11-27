'use strict';
require('dotenv').config()
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config.json')[env];

var environments = {};
environments.development = {
  host: config.host,
  database: config.database,
  username: config.username,
  password: config.password,
  dialect: config.dialect,
  charset: 'utf8',
  collate: 'utf8_general_ci',
  logging: false,
  dialectOptions: {
    useUTC: true, // for reading from database
  },
  timezone: '+00:00', // for writing to database
};
environments.test = {
  host: config.host,
  database: config.database,
  username: config.username,
  password: config.password,
  dialect: config.dialect,
  charset: 'utf8',
  collate: 'utf8_general_ci',
  logging: false,
  dialectOptions: {
    useUTC: true, // for reading from database
  },
  timezone: '+00:00', // for writing to database
};
environments.production = {
  host: config.host,
  database: config.database,
  username: config.username,
  password: config.password,
  dialect: config.dialect,
  charset: 'utf8',
  collate: 'utf8_general_ci',
  logging: false,
  dialectOptions: {
    useUTC: true, // for reading from database
  },
  timezone: '+00:00', // for writing to database
}

var currentEnvironment = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV : '';
var environmentToExport = typeof (environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.test;

module.exports = environmentToExport;