export function create({app, body, user}, res) {
    const Venue = app.services.db.Venue;
    const rows = body.rows;
    const cols = body.cols;
    const max = rows * cols;

    const venueJ = {
        name: body.name,
        address: body.address,
        phone: body.phone,
        seats: {
            rows: body.rows,
            cols: body.cols,
            total: max
        },
        isActive: true,
        createdBy: user._id
    };

    const venueO = new Venue(venueJ);
    venueO.save(
        (e, {_id}) => {
            if(e) {
                return res.sendStatus(500);
            }
            const result = {
                venue: _id.toString()
            };
            res.status(200).send(result);
        }
    );
}

// FUTURE

// export function update(req, res) {
// }

// export function getAll(req, res) {
// }

// export function getWithId(req, res) {
// }
