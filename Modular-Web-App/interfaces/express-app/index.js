import express from './express';
import passport from './passport';

export default (options, imports) => {
    const config = options.config;
    const app = express.init();


    passport.init(imports.db, options);
    app.services = imports

    app.listen(config.port, () => {
        console.log(`Listen at ${config.port}`);
    });
};
