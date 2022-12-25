export default {

  sessionStore: {
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD
    }
  },

  db: {
    uri: process.env.MONGO_URI,
    options: {
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PASSWORD
    }
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD
  },

  keyStore: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD,
    ttl: 3*60*1000
  }

};
