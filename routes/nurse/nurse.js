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

router.get("/nurse/individual-health-assessment", ensureAuthenticated, checkUserType("Nurse"), (req, res) => {
  res.render("nurse/individual-health-assessment");
});

router.post("/nurse/admit-patient", async (req, res) => {
  const { error, value } = patientSchema.validate(req.body);
  const rhu_id = req.user.rhu_id;

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const client = await rhuPool.connect();

  try {
    await client.query('BEGIN');

    // Step 1: Check if the patient exists based on either `patient_id` or `outsider_id`
    let patientId = value.patient_id || null;
    let outsiderId = value.outsider_id || null;

    let patientResult;
    if (patientId) {
      patientResult = await client.query(
        `SELECT patient_id FROM patients WHERE patient_id = $1`,
        [patientId]
      );
    } else if (outsiderId) {
      patientResult = await client.query(
        `SELECT patient_id FROM patients WHERE outsider_id = $1`,
        [outsiderId]
      );
    }

    patientId = patientResult?.rows[0]?.patient_id || null;

    // Step 2: If patient doesn't exist, insert into `patients`
    if (!patientId) {
      const newPatient = await client.query(
        `INSERT INTO patients (outsider_id, rhu_id, last_name, first_name, middle_name, suffix, phone, gender, birthdate, house_no, street, barangay, city, province, occupation, email, philhealth_no, guardian) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING patient_id`,
        [
          outsiderId, rhu_id, value.last_name, value.first_name, 
          value.middle_name || null, value.suffix || null, value.phone || null, 
          value.gender, value.birthdate, value.house_no || null, value.street || null, 
          value.barangay, value.city, value.province, value.occupation || null, 
          value.email || null, value.philhealth_no || null, value.guardian || null
        ]
      );
      patientId = newPatient.rows[0].patient_id;
    }

    // Step 3: Check if the patient has a record in `patient_history`
    const historyResult = await client.query(
      `SELECT * FROM patient_history WHERE patient_id = $1 OR outsider_id = $2`,
      [patientId, outsiderId]
    );

    // Step 4: Gather existing records from `nurse_checks`, `doctor_visits`, and `medtech_labs`
    const nurseCheckResult = await client.query(
      `SELECT * FROM nurse_checks WHERE patient_id = $1 OR outsider_id = $2`,
      [patientId, outsiderId]
    );

    const doctorVisitResult = await client.query(
      `SELECT * FROM doctor_visits WHERE patient_id = $1 OR outsider_id = $2`,
      [patientId, outsiderId]
    );

    const medtechLabResult = await client.query(
      `SELECT * FROM medtech_labs WHERE patient_id = $1 OR outsider_id = $2`,
      [patientId, outsiderId]
    );

    // Step 5: Move data from `nurse_checks`, `doctor_visits`, and `medtech_labs` to `patient_history` if records exist
    if (nurseCheckResult.rows.length > 0 || doctorVisitResult.rows.length > 0 || medtechLabResult.rows.length > 0) {
      // Move `nurse_checks` data
      if (nurseCheckResult.rows.length > 0) {
        const checkData = nurseCheckResult.rows[0];
        await client.query(
          `INSERT INTO patient_history (patient_id, outsider_id, rhu_id, last_name, first_name, middle_name, phone, gender, birthdate, house_no, street, barangay, city, province, occupation, philhealth_no, guardian, age, check_date, height, weight, systolic, diastolic, temperature, heart_rate, respiratory_rate, bmi, comment) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
          [
            checkData.patient_id, checkData.outsider_id, rhu_id, value.last_name, 
            value.first_name, value.middle_name || null, value.phone || null, value.gender, 
            value.birthdate, value.house_no || null, value.street || null, value.barangay, 
            value.city, value.province, value.occupation || null, value.philhealth_no || null, 
            value.guardian || null, checkData.age || null, checkData.check_date, 
            checkData.height, checkData.weight, checkData.systolic, checkData.diastolic, 
            checkData.temperature, checkData.heart_rate, checkData.respiratory_rate, 
            checkData.bmi, checkData.comment || null
          ]
        );
        await client.query(`DELETE FROM nurse_checks WHERE patient_id = $1 OR outsider_id = $2`, [patientId, outsiderId]);
      }

      // Move `doctor_visits` data
      if (doctorVisitResult.rows.length > 0) {
        const visitData = doctorVisitResult.rows[0];
        await client.query(
          `INSERT INTO patient_history (patient_id, outsider_id, follow_date, diagnosis, findings, category, service, medicine, instruction, quantity) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            visitData.patient_id, visitData.outsider_id, visitData.follow_date, 
            visitData.diagnosis || null, visitData.findings || null, 
            visitData.category || null, visitData.service || null, 
            visitData.medicine || null, visitData.instruction || null, visitData.quantity || null
          ]
        );
        await client.query(`DELETE FROM doctor_visits WHERE patient_id = $1 OR outsider_id = $2`, [patientId, outsiderId]);
      }

      // Move `medtech_labs` data
      if (medtechLabResult.rows.length > 0) {
        const labData = medtechLabResult.rows[0];
        await client.query(
          `INSERT INTO patient_history (patient_id, outsider_id, lab_result) 
          VALUES ($1, $2, $3)`,
          [labData.patient_id, labData.outsider_id, labData.lab_result || null]
        );
        await client.query(`DELETE FROM medtech_labs WHERE patient_id = $1 OR outsider_id = $2`, [patientId, outsiderId]);
      }
    }

    // Step 6: Insert new data into `nurse_checks`
    await client.query(
      `INSERT INTO nurse_checks (patient_id, outsider_id, age, check_date, height, weight, systolic, diastolic, temperature, heart_rate, respiratory_rate, bmi, comment) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [patientId, outsiderId, value.age || null, value.check_date || 'DEFAULT', value.height, value.weight, value.systolic, value.diastolic, value.temperature, value.heart_rate, value.respiratory_rate, value.bmi, value.comment || null]
    );

    await client.query('COMMIT');
    res.redirect("/nurse/patient-registration");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error: ", err);
    res.status(500).json({ error: "An internal server error occurred" });
  } finally {
    client.release();
  }
});

module.exports = router;