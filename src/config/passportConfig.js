const LocalStrategy = require("passport-local").Strategy;
const passport = require("passport");
const rhuPool = require("./rhudb");
const bcrypt = require("bcrypt");

const authenticateuser = (username, password, done) => {
    const trimmedUsername = username.trim();

    rhuPool.query("SELECT * FROM users WHERE username = $1", [trimmedUsername],
        async (err, results) => {
            if (err){
                return done(err);
            } if (results.rows.length > 0){
                const user = results.rows[0];
                try {
                    const isMatch = await bcrypt.compare(password, user.password);
                    if (isMatch){
                        return done(null, user);
                    } else{
                        return done(null, false, {message: "password is incorrect"});
                    }
                } catch (compareErr) {
                    return done(compareErr);
                }
            } else{
                return done(null, false, {message: "username not registered"});
            }
        }
    )
};

function initialize(passport){
    passport.use(
        new LocalStrategy({
            usernameField: "username",
            passwordField: "password"
        }, authenticateuser)
    )
};

passport.serializeUser((user, done) => {
    if (!user || typeof user !== 'object' || !user.id) {
        return done(new Error("User not found or ID is missing"));
    }
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    rhuPool.query("SELECT * FROM users WHERE id = $1", [id], (err, results) => {
        if (err) {
            return done(err);
        }
        if (results.rows.length === 0) {
            return done(new Error("User not found"));
        }
        const user = results.rows[0];
        done(null, user);
    });
});

module.exports = initialize;