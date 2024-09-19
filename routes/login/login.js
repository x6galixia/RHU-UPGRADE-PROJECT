const express = require("express");
const router = express.Router();
const passport = require("passport");
const Joi = require("joi");
const rhuPool = require("../../models/rhudb");

const userSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  user_type: Joi.string().required()
});

router.get("/user/login", (req, res) => {
  res.render("login/login");
});

router.post("/login/user", async (req, res, next) => {
  const {error, value} = userSchema.validate(req.body);

  if(error){
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    passport.authenticate("local", (err, user, info) => {
      if (err){
        console.error("Authentication error :", err);
        return next(err);
      } if (!user){
        console.log("Authentication failed:", info.message);
        req.flash("error", info.message);
        return res.redirect("/user/login");
      } if (user.user_type !== value.user_type) {
        req.flash("error", "User type does not match.");
        return res.redirect("/user/login");
      }
      req.login(user, (err) => {
        if (err){
          console.error("Login error:", err);
          return next(err);
        }
        switch (value.user_type) {
          case "Nurse":
            return res.redirect("/nurse/patient-registration");
          case "Doctor":
            return res.redirect("/doctor-dashboard");
          case "Med Tech":
            return res.redirect("/medtech-dashboard");
          case "Pharmacist":
            return res.redirect("/pharmacy-inventory");
          default:
            return res.redirect("/");
        }
      });
    })(req, res, next);;
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;