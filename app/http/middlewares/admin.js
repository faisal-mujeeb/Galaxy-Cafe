function admin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        // console.log("ayush");
        return next();
    }
    return res.redirect('/')
}

module.exports = admin;