const FB = JSON.parse(process.env.FB_CONFIG);
const serviceAccountConfig = JSON.parse(process.env.FIREBASE_CONFIG);

export default {

  sessionCookie: {
    secure: true
  },

  secure: {
    ssl: true
  },


  db: {
    uri: process.env.MONGO_URI,
    options: {
      user: process.env.MONGO_USERNAME,
      pass: process.env.MONGO_PASSWORD,
      db: {
          readPreference: 'secondaryPreferred',
          slaveOk: true,
      },
      replset: {
          replicaSet: 'replicaSet-0',
          socketOptions: {
              connectionTimeout: 50000,
              socketTimeoutMS: 50000,
          }
      },
      server: {
          w: 1,
          keepAlive: 30000,
          autoReconnect: true
      },
    },
  },

  facebook: {
    clientID: FB.clientId,
    clientSecret: FB.clientSecret,
  },

};
