import _ from 'lodash';
import path from 'path';
import defaultConfig from './default';


const envFilename = process.env.NODE_ENV || 'local'; 
const envConfig = require(`./${envFilename}`) || {};

const convenience = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isLocal: process.env.NODE_ENV === 'local',
  isTest: process.env.NODE_ENV === 'test',
};

const appConfig = _.merge(defaultConfig, envConfig, convenience);

export default appConfig;
