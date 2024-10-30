const express = require("express");
const router = express.Router();
const rhuPool = require("../../models/rhudb");
const { setUserData, ensureAuthenticated, checkUserType } = require("../../middlewares/middleware");
const methodOverride = require("method-override");
const Joi = require("joi");
const bcrypt = require("bcrypt");

router.use(setUserData);
router.use(methodOverride("_method"));

const userSchema = Joi.object({
  rhu_id: Joi.number().integer().required(),
  surname: Joi.string().required(),
  firstname: Joi.string().required(),
  middle_name: Joi.string().optional(),
  profession: Joi.string().optional(),
  license_number: Joi.string().optional(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
  user_type: Joi.string().required()
});

router.use(express.json());

router.get("/doctor/patient-history", (req, res) => {
  res.render("doctor/patient-history", {
    user: req.user
  });
})

module.exports = router;