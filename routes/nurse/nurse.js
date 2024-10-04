const express = require("express");
const router = express.Router();
const rhuPool = require("../../models/rhudb");
const { setUserData, ensureAuthenticated, checkUserType } = require("../../middlewares/middleware");
const Joi = require("joi");

router.use(setUserData);

const patientSchema = Joi.object({

  patient_id: Joi.number().integer().optional(),
  outsider_id: Joi.string().allow('').optional(),
  rhu_id: Joi.number().integer(),
  //nurse
  last_name: Joi.string().required(),
  first_name: Joi.string().required(),
  middle_name: Joi.string().allow('').optional(),
  suffix: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  gender: Joi.string().required(),
  birthdate: Joi.date().required(),
  age: Joi.string().allow('').optional(),
  house_no: Joi.number().integer().allow('').optional(),
  street: Joi.string().allow('').optional(),
  barangay: Joi.string().required(),
  city: Joi.string().required(),
  province: Joi.string().required(),
  occupation: Joi.string().allow('').optional(),
  email: Joi.string().allow('').optional(),
  philhealth_no: Joi.string().allow('').optional(),
  guardian: Joi.string().allow('').optional(),
  check_date: Joi.date().required(),
  height: Joi.number().integer().required(),
  weight: Joi.number().integer().required(),
  systolic: Joi.number().integer().required(),
  diastolic: Joi.number().integer().required(),
  temperature: Joi.number().integer().required(),
  heart_rate: Joi.number().integer().required(),
  respiratory_rate: Joi.number().integer().required(),
  bmi: Joi.number().integer().required(),
  comment: Joi.number().integer().allow('').optional(),
  //doctor
  follow_date: Joi.date().allow('').optional(),
  diagnosis: Joi.string().allow('').optional(),
  findings: Joi.string().allow('').optional(),
  category: Joi.string().allow('').optional(),
  service: Joi.string().allow('').optional(),
  medicine: Joi.string().allow('').optional(),
  instruction: Joi.string().allow('').optional(),
  quantity: Joi.string().allow('').optional(),
  //medtech
  lab_result: Joi.string().allow('').optional()

});

router.get("/nurse-dashboard", ensureAuthenticated, checkUserType("Nurse"), (req, res) => {
  res.render("nurse/nurse-dashboard");
});

router.get("/nurse/patient-registration", ensureAuthenticated, checkUserType("Nurse"), (req, res) => {
  res.render("nurse/patient-registration");
});

router.get("/nurse/individual-health-assesment", ensureAuthenticated, checkUserType("Nurse"), (req, res) => {
  res.render("nurse/individual-health-assesment");
});

router.post("/nurse/admit-patient", async (req, res) => {
  const { error, value } = patientSchema.validate(req.body);
  const rhu_id = req.user.rhu_id;

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    await rhuPool.query(
      `INSERT INTO patients (patient_id, outsider_id, rhu_id, last_name, first_name, middle_name, suffix, phone, gender, birthdate, house_no, street, barangay, city, province, occupation, email, philhealth_no, guardian) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [value.patient_id || null, value.outsider_id || null, rhu_id, value.last_name, value.first_name, value.middle_name || null, value.suffix || null, value.phone || null, value.gender, value.birthdate, value.house_no || null, value.street || null, value.barangay, value.city, value.province, value.occupation || null, value.email || null, value.philhealth_no || null, value.guardian || null]
    );

    await rhuPool.query(
      `INSERT INTO nurse_checks (patient_id, outsider_id, age, check_date, height, weight, systolic, diastolic, temperature, heart_rate, respiratory_rate, bmi, comment) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [value.patient_id || null, value.outsider_id || null, value.age || null, value.check_date || 'DEFAULT', value.height, value.weight, value.systolic, value.diastolic, value.temperature, value.heart_rate, value.respiratory_rate, value.bmi, value.comment || null]
    );

    res.redirect("/nurse-dashboard");
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

module.exports = router;