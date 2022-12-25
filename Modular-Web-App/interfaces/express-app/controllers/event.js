export function create({app, body, user}, res) {
    const db = app.services.db;
    const eventJ = {
        name: body.name,
        description: body.description,
        venue: body.venue,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        createdBy: user._id
    };

    const errors = [];
    if(eventJ.name == null || eventJ.name == ''){
        errors.push('Event should have a name');
    }
    if(eventJ.venue == null || eventJ.venue == ''){
        errors.push('Event should have a venue');
    }
    if(eventJ.startTime.getTime() >= eventJ.endTime.getTime()){
        errors.push('Start time should be less than end time.');
    }
    if (errors.length > 1) {
        return res.status(400).send({ errors });
    }

    db.Venue.findById(eventJ.venue, (e, venue) => {
        if(e) {
            return res.sendStatus(500);
        }
        if(!venue){
            errors.push("Incorrect Venue ID in request.");
            res.status(400).send({ errors });
        }

        const totalSeats = venue.seats.total;
        const available = new Array(totalSeats);
        for(let i = 0; i < totalSeats; i++) {
            available[i] = true;
        }

        eventJ.seats = {
            rows: venue.seats.rows,
            cols: venue.seats.cols,
            ticketCategories: body.ticketCategories,
            available
        };

        const eventO = new db.Event(eventJ);
        eventO.save((e, {_id}) => {
            if(e){
                return res.sendStatus(500);
            }
            const result = {
                event: _id.toString()
            };
            res.status(200).send(result);
        });
    });
}


export function update(req, res) {
    res.sendStatus(404);
}

export function getWithId({app, params}, res) {
    const db = app.services.db;
    const eventid = params.id;
    const result = {};

    db.Event.findById(eventid, (e, event) => {
        if(e) {
            e.printStackTrace();
            return res.status(500).send({ error: e.toString() });
        }
        result.event = {
            name: event.name,
            description: event.description,
            venue: event.venue,
            startTime: event.startTime,
            endTime: event.endTime,
            rows: event.seats.rows,
            cols: event.seats.cols,
            ticketCategories: event.seats.ticketCategories,
            available: event.seats.available
        };
        res.status(200).send(result);
    });
}

export function getAll(req, res) {
    res.sendStatus(404);
}
