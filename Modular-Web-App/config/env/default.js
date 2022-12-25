export default {

  port: process.env.PORT || 8080,

  sessionCookie: {
    maxAge: 24 * (60 * 60 * 1000),
    httpOnly: true,
    secure: false
  },

  app: {
    title: 'Ticket booking demo',
    description: 'Books tickets concurrently and uses a microserver architecture'
  },

  sessionSecret: process.env.SESSION_SECRET || 'secret',

  sessionStore: {
    storeTo: 'mongo',
  },

};
