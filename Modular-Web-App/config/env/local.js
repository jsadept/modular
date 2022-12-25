export default {

  sessionStore: {
    redis: {
      host: '127.0.0.1',
      port: 8888,
      username: '',
      password: ''
    }
  },

  db: {
    uri: 'mongodb://localhost/bookingapp',
    options: {
      user: '',
      pass: ''
    }
  },

  redis: {
    host: '127.0.0.1',
    port: 8888,
    username: '',
    password: ''
  },

  keyStore: {
    host: '127.0.0.1',
    port: 8888,
    username: '',
    password: '',
    ttl: 3*60*1000 
  }

};
