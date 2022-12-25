export default {

  db: {
    uri: process.env.MONGO_URI,
    options: {
      user: process.env.MONGO_USERNAME,
      pass: process.env.MONGO_PASSWORD,
      server: {
          w: 1,
          keepAlive: 30000,
          autoReconnect: true
      },
    },
  },

};
