function setUserData(req, res, next) {
    if (req.isAuthenticated()) {
        res.locals.rhu_id = req.user.rhu_id;
        res.locals.firstname = req.user.firstname;
        res.locals.surname = req.user.surname;
        res.locals.middle_initial = req.user.middle_name;
        res.locals.profession = req.user.profession;
    } else {
        res.locals.rhu_id = null;
        res.locals.firstname = null;
        res.locals.surname = null;
        res.locals.middle_initial = null;
        res.locals.profession = null;
    }
    next();
}

module.exports = {
    setUserData
};