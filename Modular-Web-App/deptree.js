import config from './config/env';

export const booking = {
  server: {
    packagePath: 'modules/bookings',
    packageRole: 'server',
    server: config.redis,
    keyStore: config.keyStore,
    DEBUG: false
  },
  client: {
    packagePath: 'modules/bookings',
    packageRole: 'client',
    server: config.redis
  },
  module: {
    packagePath: 'modules/bookings',
    packageRole: 'default',
    keyStore: config.keyStore
  }
};

export const common = [
  {
    'packagePath': 'models',
    'server': config.db
  }
];

export const expressApp = {
    'packagePath': 'interfaces/express-app',
    'config': config,
};

export const mainapp = [ exports.expressApp, exports.booking.client ]
  .concat(exports.common);

export const bookingservice = [ exports.booking.server ]
  .concat(exports.common);

export const monolith = [ exports.expressApp, exports.booking.module ]
  .concat(exports.common);

export default exports;
