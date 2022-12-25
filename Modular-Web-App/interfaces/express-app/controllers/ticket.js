export function create({body, user, app}, res) {
    const blockJ = {
        event: body.event,
        seats: body.seats,
        user: user._id.toString()
    };

    app.services.booking.checkAndBlockSeats(
        blockJ,
        (e, ticketid) => {
            if(e){
                return res.status(500).send({ errors: [ e.toString() ] });
            }
            if(!ticketid){
                const errors = [ "No reply from booking microservice" ];
                return res.status(500).send({ errors });
            }
            const result = {
                ticket: ticketid
            };
            res.status(200).send(result);
        }
    );
}

export function update({params, user, app}, res) {
    const ticketInfo = {
        ticket: params.id,
        user: user._id.toString(),
        name: user.fullname
    };
    app.services.booking.confirmSeats(ticketInfo,
        e => {
            if(e){
                e.printStackTrace();
                return res.status(500).send({ errors: [ e.toString() ] });
            }
            res.sendStatus(200);
        }
    );
}

export function getAll(req, res) {
    res.sendStatus(404);
}

export function getWithId({params}, res) {
    const tickid = params.id;
    res.sendStatus(404);
}
