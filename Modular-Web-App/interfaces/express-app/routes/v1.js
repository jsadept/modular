import passport from 'passport';
import userController from '../controllers/user.js';
import eventController from '../controllers/event.js';
import venueController from '../controllers/venue.js';
import ticketController from '../controllers/ticket.js';

exports = module.exports = app => {
    app.post('/v1/login', passport.authenticate('local'), userController.login);
    app.post('/v1/logout', userController.logout);
    app.post('/v1/register', userController.register);

    app.all('/v1/*', userController.checkAuth);

    app.route('/v1/event/:id')
    .get(eventController.getWithId);

    app.route('/v1/event')
    .post(eventController.create)
    .patch(eventController.update)
    .get(eventController.getAll);

    app.route('/v1/venue/:id')
    .post(venueController.getWithId);

    app.route('/v1/venue')
    .post(venueController.create)
    .patch(venueController.update)
    .get(venueController.getAll);

    app.route('/v1/ticket/:id')
    .patch(ticketController.update)
    .get(ticketController.getWithId);

    app.route('/v1/ticket')
    .post(ticketController.create)
    .get(ticketController.getAll);
}
