import redis from 'redis';
import async from 'async';

const BookingService = function({DEBUG, keyStore}, imports) {
    this.DEBUG = DEBUG;
    this.EventSchema = imports['db.Event'];
    this.TicketSchema = imports['db.Ticket'];
    this.UserSchema = imports['db.User'];

    this.keyStore = redis.createClient({
        host: keyStore.host,
        port: keyStore.port,
        user: keyStore.username,
        pass: keyStore.password
    });
    this.kvTTL = keyStore.ttl;

    this.keyStore.on('connect',
        () => {
            console.log('Redis connected');
        }
    );
};

(function() {

    this.checkAndBlockSeats = function(data, done){
        const me = this;
        const eventid = data.event;
        let ticketid;
        const seats = data.seats;
        const userid = data.user;
        let price = 0;
    
        async.waterfall([
            cb => {
                me.EventSchema.findById(eventid, cb);
            },
            (event, cb) => {
                if(!event){
                    return cb(new Error(`Eventid ${eventid} not found.`));
                }
                const maxRows = event.seats.rows;
                const maxCols = event.seats.cols;
                for(let i=0; i<seats.length; i++){
                    const seat = seats[i];
                    const row = seat.row;
                    const col = seat.col;
                    if (! event.isSeatAvailable(row, col) ){
                        return cb(new Error(`Seat ${row}, ${col} is not available`));
                    }
                    price += event.getPrice(row, col);
                }
    
                async.map(
                    seats,
                    (seat, cb) => {
                        const row = seat.row;
                        const col = seat.col;
                        const blockkey = `${eventid}-${row}-${col}`;
                        me.keyStore.get(blockkey, (er, data) => {
                            if (er) return cb(er);
                            if (!data || data == userid) return cb();
                            return cb(new Error(`Unable to block ${row}, ${col}`));
                        });
                    },
                    e => {
                        return cb(e, event);
                    }
                );
            },
            (event, cb) => { 
                async.map(
                    seats,
                    (seat, cb) => {
                        const row = seat.row;
                        const col = seat.col;
                        const blockkey = `${eventid}-${row}-${col}`;
                        me.keyStore.setex(blockkey, me.kvTTL, userid, (er, data) => {
                            if (er) return cb(er);
                            return cb();
                        });
                    },
                    e => {
                        return cb(e);
                    }
                );
            },
            cb => { 
                const ticketJ = {
                    event: eventid,
                    seats,
                    price,
                    status: 'pending',
                    createdBy: userid
                };
            
                const ticketO = new me.TicketSchema(ticketJ);
                ticketO.save((e, {_id}) => {
                    if(e) {
                        e.printStackTrace();
                        return res.json(500, { errors: [ e.toString() ] });
                    }
                    ticketid = _id.toString();
                    cb();
                });
            }
        ], e => {
            if(e){
                if(ticketid){
                    me.TicketSchema.removeById( ticketid );
                }
                return done(e);
            }
            done(null, ticketid);
        });
    };

    this.confirmSeats = function(data, done) {
        console.log("configmSeats");

        const me = this;
        const ticketid = data.ticket;
        const userid = data.user;
        const fullname = data.fullname;
        let ticketDoc;
        let eventid;

        async.waterfall([
            cb => {
                const exTime = new Date( new Date() - me.kvTTL );
                const query = {
                    _id : ticketid,
                    status: 'pending',
                    createdOn: { $gt: exTime }
                };
                me.TicketSchema.findOne(query, cb);
            },
            (ticket, cb) => {
                if(!ticket) {
                    const e = new Error("Your blocks on the seats have expired");
                    return cb(e);
                }

                ticketDoc = ticket;
                eventid = ticket.event;
                me.EventSchema.findById(eventid, cb);
            },
            (event, cb) => {
                if(me.DEBUG) console.log('update event');
                if(!event){
                    return cb(new Error('event not found'));
                }
                const seats = ticketDoc.seats;
                const countTickets = seats.length;
                const maxRows = event.seats.rows;
                const maxCols = event.seats.cols;
                for(let i=0; i<countTickets; i++){
                    const row = seats[i].row;
                    const col = seats[i].col;
                    const idx = row * maxCols + col;
                    event.seats.available[idx] = false;
                }
                event.ticketsSold.push({
                    name: fullname,
                    user: userid,
                    ticket: ticketid
                });
                event.ticketsSoldCount += countTickets;
                event.isSoldOut = ( event.maximumTickets <= event.ticketsSoldCount);
                event.save(e => { cb(e); });
            },
            cb => {
                if(me.DEBUG) console.log('update ticket');
                ticketDoc.status = 'paid';
                ticketDoc.updatedOn = new Date();
                ticketDoc.save(e => { cb(e); });
            },
            cb => {
                if(me.DEBUG) console.log('update ticket in user schema');
                const eventid = ticketDoc.event;
                const update = {
                    $push: {
                        tickets: {
                            ticket: ticketid,
                            event: eventid 
                        }
                    }
                };
                me.UserSchema.findByIdAndUpdate(
                    userid,
                    update,
                    cb
                );
            }
        ], done );
    };

}).call(BookingService.prototype);

export default BookingService;
