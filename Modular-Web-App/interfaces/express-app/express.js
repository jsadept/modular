import config from './../../config/env';
import express from 'express';
import routeFiles from './routes';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
import session from 'express-session';
import compress from 'compression';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import subdomain from 'subdomain';
import _ from 'lodash';

if (config.sessionStore.storeTo === 'redis') {
  const RedisStore = require('connect-redis')(session);
} else if (config.sessionStore.storeTo === 'memcached') {
  const MemcachedStore = require('connect-memcached')(session);
} else if (config.sessionStore.storeTo === 'mongo') {
  const MongoStore = require('connect-mongo')(session);
  const mongoose = require('mongoose');
} else {
  throw new Error('no session store specified in config');
}

export function initLocalVariables(app) {
  app.locals.title = config.app.title;
  app.locals.description = config.app.description;
  if (config.secure && config.secure.ssl === true) {
    app.locals.secure = config.secure.ssl;
  }
  app.locals.googleAnalyticsTrackingID = config.app.googleAnalyticsTrackingID;
  app.locals.facebookAppId = config.facebook.clientID;

  app.use(({protocol, hostname, headers, originalUrl}, {locals}, next) => {
    locals.host = `${protocol}://${hostname}`;
    locals.url = `${protocol}://${headers.host}${originalUrl}`;
    next();
  });
}

export function initMiddleware(app) {
  app.set('showStackError', true);

  app.enable('jsonp callback');

  app.use(compress({
    filter(req, res) {
      return (/json|text/).test(res.getHeader('Content-Type'));
    },
    level: 9
  }));

  if (config.isDevelopment || config.isLocal) {
    app.use(morgan('dev'));
  }

  if (config.isLocal) {
    app.set('view cache', false);
  }

  if (config.isProduction) {
    app.locals.cache = 'memory';
  }

  app.set('view engine', 'pug');
  app.set('views', 'interfaces/webapp/views');

  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(methodOverride());

  app.use(cookieParser());

  const base = `${config.host}:${config.port}`
  app.use(subdomain({ base, removeWWW : true }));
}

export function initSession(app) {
  if (config.sessionStore.storeTo === 'redis') {
    const sessionStorage = new RedisStore(config.sessionStore.redis);
  } else if (config.sessionStore.storeTo === 'memcached') {
    const sessionStorage = new MemcachedStore(config.sessionStore.memcached);
  } else {
    const sessionStorage = new MongoStore({ mongooseConnection: mongoose.connection });
  }

  sessionStorage.on('disconnect', () => {
      console.info('session store is not connected');
  });

  sessionStorage.on('error', (e) => {
      console.error('session store error');
      console.error(e);
  });

  app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: config.sessionSecret,
    cookie: {
      maxAge: config.sessionCookie.maxAge,
      httpOnly: config.sessionCookie.httpOnly,
      domain: config.sessionCookie.domain,
      secure: config.sessionCookie.secure && config.secure.ssl
    },
    key: config.sessionKey,
    store: sessionStorage
  }));

  if (config.isDevelopment || config.isProduction) {
    app.disable('etag');
    app.set('trust proxy', true);
  }

  app.use(passport.initialize());
  app.use(passport.session());
}


export function initHelmet(app) {
  const SIX_MONTHS = 15778476000;
  app.use(helmet.frameguard());
  app.use(helmet.xssFilter());
  app.use(helmet.noSniff());
  app.use(helmet.ieNoOpen());
  app.use(helmet.hsts({
    maxAge: SIX_MONTHS,
    includeSubdomains: true,
    force: true
  }));
  app.disable('x-powered-by');
}


export function initModulesClientRoutes(app) {
  app.use('/', express.static(path.resolve('interfaces/webapp/public')));
}

export function initRoutes(app) {
    routeFiles.forEach( jsfile => {
        require( path.join( __dirname, 'routes', jsfile) ) (app);
    });
}

export function initErrorRoutes(app) {
  app.use((err, req, res, next) => {
    if (!err) {
      return next();
    }

    console.error(err.stack);
    res.status(500).send({error: err.toString()});
  });
}

export function init() {
  const app = express();
  this.initMiddleware(app);
  this.initSession(app);
  this.initHelmetHeaders(app);
  this.initModulesClientRoutes(app);
  this.initRoutes(app);
  this.initErrorRoutes(app);
  return app;
}
