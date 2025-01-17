function setUserData(req, res, next) {
    if (req.isAuthenticated()) {
        res.locals.rhu_id = req.user.rhu_id;
        res.locals.firstname = req.user.firstname;
        res.locals.license_number = req.user.license_number;
        res.locals.surname = req.user.surname;
        res.locals.middle_initial = req.user.middle_name;
        res.locals.profession = req.user.profession;
        res.locals.user_type = req.user.user_type;
    } else {
        res.locals.rhu_id = null;
        res.locals.firstname = null;
        res.locals.surname = null;
        res.locals.license_number = null;
        res.locals.middle_initial = null;
        res.locals.profession = null;
        res.locals.user_type = null;
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
        // If user is authenticated, redirect based on user type
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
                return res.redirect("/user/login");
        }
    }
    next(); // Proceed if user is not authenticated
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