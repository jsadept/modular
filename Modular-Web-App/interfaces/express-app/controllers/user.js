export function login(req, res) {
    const user = req.user;
    const userJ = {
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        tickets: user.tickets,
        eventMgr: user.eventMgr
    };
    res.status(200).send(userJ);
}

export function logout(req, res) {
    req.logout();
    res.sendStatus(200);
}

export function register({app, body}, res) {
    const User = app.services.db.User;
    const user = new User({
        username: body.username,
        email: body.email,
        fullname: body.fullname
    });
    User.register(
        user,
        body.password,
        e => {
            if (e) { 
                return res.status(400).send({ error: e.toString() });
            }
            res.sendStatus(200);
        }
    );
}

export function checkAuth({user}, res, next) {
    if(!user){
        return res.sendStatus(404);
    }
    next();
}


// FUTURE

// export function create(req, res) {
// }

// export function update(req, res) {
// }
