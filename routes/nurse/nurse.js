const express = require("express");
const router = express.Router();
const rhuPool = require("../../models/rhudb");
const pharmacyPool = require("../../models/pharmacydb");
const { setUserData, ensureAuthenticated, checkUserType } = require("../../middlewares/middleware");
const Joi = require("joi");

router.use(setUserData);

const patientSchema = Joi.object({
  patient_id: Joi.number().integer().optional(),
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
  completeAddress: Joi.string().required(),
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

const addressSchema = Joi.object({
  house_no: Joi.number().integer().allow('').optional(),
  street: Joi.string().allow('').optional(),
  barangay: Joi.string().required(),
  city: Joi.string().required(),
  province: Joi.string().required(),
  completeAddress: Joi.string().required(),
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

  const addressParts = value.completeAddress.split(',');


  if (addressParts.length !== 5) {
    return res.status(400).json({ error: "Please enter the address in the correct format: house_no, street, barangay, city, province" });
  }

  const [house_no, street, barangay, city, province] = addressParts.map(part => part.trim());

  const address = {
    house_no: house_no === '' ? null : Number(house_no),
    street: street || '', // Allow empty string
    barangay: barangay,
    city: city,
    province: province,
    completeAddress: value.completeAddress, // Include the complete address if needed
  };

  console.log(value.house_no);
  console.log(value.street);
  console.log(value.patient_id);
  console.log(value.barangay);
  console.log(value.city);
  console.log(value.province);

  const { error: addressError } = addressSchema.validate(address);
  if (addressError) {
    return res.status(400).json({ error: 'Invalid address: ' + addressError.details[0].message });
  }


  if (error) {
    return res.status(400).json({ error: 'Invalid patient data: ' + error.details[0].message });
  }

  if (error) {
    return res.status(400).json({ error: 'Invalid address: ' + error.details[0].message });
  }


  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const client = await rhuPool.connect();

  try {
    await client.query('BEGIN');

    // Step 1: Check if the patient exists by looking up both `patient_id` and `outsider_id`
    const patientResult = await client.query(
      `SELECT patient_id, outsider_id FROM patients WHERE (patient_id = $1 AND patient_id IS NOT NULL) OR (outsider_id = $2 AND outsider_id IS NOT NULL)`,
      [value.patient_id, value.outsider_id]
    );

    let patientId = null;
    let outsiderId = null;

    if (patientResult.rows.length > 0) {
      // Set patientId and outsiderId based on the result from the database
      patientId = patientResult.rows[0].patient_id;
      outsiderId = patientResult.rows[0].outsider_id;
    } else {
      return res.status(400).json({ error: "Patient not found" });
    }

    // Step 2: Check for existing records in `nurse_checks`, `doctor_visits`, and `medtech_labs`
    const nurseCheckResult = await client.query(
      `SELECT * FROM nurse_checks WHERE (patient_id = $1 AND patient_id IS NOT NULL) OR (outsider_id = $2 AND outsider_id IS NOT NULL)`,
      [patientId, outsiderId]
    );

    const doctorVisitResult = await client.query(
      `SELECT * FROM doctor_visits WHERE (patient_id = $1 AND patient_id IS NOT NULL) OR (outsider_id = $2 AND outsider_id IS NOT NULL)`,
      [patientId, outsiderId]
    );

    const medtechLabResult = await client.query(
      `SELECT * FROM medtech_labs WHERE (patient_id = $1 AND patient_id IS NOT NULL) OR (outsider_id = $2 AND outsider_id IS NOT NULL)`,
      [patientId, outsiderId]
    );

    // Step 3: Move records to `patient_history`
    if (nurseCheckResult.rows.length > 0 || doctorVisitResult.rows.length > 0 || medtechLabResult.rows.length > 0) {
      // Move `nurse_checks` data if it exists
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
        await client.query(`DELETE FROM nurse_checks WHERE (patient_id = $1 AND patient_id IS NOT NULL) OR (outsider_id = $2 AND outsider_id IS NOT NULL)`, [patientId, outsiderId]);
      }

      // Move `doctor_visits` data if it exists
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
        await client.query(`DELETE FROM doctor_visits WHERE (patient_id = $1 AND patient_id IS NOT NULL) OR (outsider_id = $2 AND outsider_id IS NOT NULL)`, [patientId, outsiderId]);
      }

      // Move `medtech_labs` data if it exists
      if (medtechLabResult.rows.length > 0) {
        const labData = medtechLabResult.rows[0];
        await client.query(
          `INSERT INTO patient_history (patient_id, outsider_id, lab_result) 
          VALUES ($1, $2, $3)`,
          [labData.patient_id, labData.outsider_id, labData.lab_result || null]
        );
        await client.query(`DELETE FROM medtech_labs WHERE (patient_id = $1 AND patient_id IS NOT NULL) OR (outsider_id = $2 AND outsider_id IS NOT NULL)`, [patientId, outsiderId]);
      }
    }

    // Step 4: Insert new data into `nurse_checks`
    await client.query(
      `INSERT INTO nurse_checks (patient_id, outsider_id, age, check_date, height, weight, systolic, diastolic, temperature, heart_rate, respiratory_rate, bmi, comment) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [patientId || null, outsiderId || null, value.age || null, value.check_date || 'DEFAULT', value.height, value.weight, value.systolic, value.diastolic, value.temperature, value.heart_rate, value.respiratory_rate, value.bmi, value.comment || null]
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


router.get('/nurse/fetchScannedData', async (req, res) => {
  const { qrCode } = req.query;
  console.log('Received scanned QR Code:', qrCode);
  // res.json({ success: true, message: 'Data received' });

  try {
    const queryText = `
      SELECT * FROM beneficiary
      WHERE beneficiary_id = $1
    `;

    console.log('Received scanned QR Code:', queryText);
    const result = await pharmacyPool.query(queryText, [qrCode]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      console.log(`User not found for unq_id=${unq_id}`);
      res.status(404).send("User not found");
    }
  } catch (err) {
    console.error("Error querying database:", err.message);
    res.status(500).send("Server error");
  }

});


module.exports = router;