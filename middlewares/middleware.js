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

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.rhu_id) {
            return next();
        } else {
            res.redirect("/user/login");
        }
    } else {
        res.redirect("/user/login");
    }
}

function ensureAdminAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.rhu_id) {
            return next();
        } else {
            res.redirect("/admin/login");
        }
    } else {
        res.redirect("/admin/login");
    }
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        const user = req.user;
        switch (user.user_type) {
            case "Nurse":
                return res.redirect("/nurse/patient-registration");
            case "Doctor":
                return res.redirect("/doctor-dashboard");
            case "Med Tech":
                return res.redirect("/medtech-dashboard");
            case "Pharmacist":
                return res.redirect("/pharmacy-inventory");
            case "Admin": 
                return res.redirect("/admin-dashboard");
            default:
                return res.redirect("/");
        }
    }
    next();
}

function checkUserType(userType) {
    return function (req, res, next) {
        if (req.isAuthenticated() && req.user.user_type === userType && req.user.rhu_id) {
            return next();
        }
        res.redirect("/user/login");
    };
}


module.exports = {
    setUserData,
    ensureAuthenticated,
    checkNotAuthenticated,
    checkUserType,
    ensureAdminAuthenticated
};