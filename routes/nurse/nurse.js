const express = require("express");
const router = express.Router();
const rhuPool = require("../../models/rhudb");
const pharmacyPool = require("../../models/pharmacydb");
const { setUserData, ensureAuthenticated, checkUserType } = require("../../middlewares/middleware");
const { calculateAge, formatDate } = require("../../public/js/global/functions");
const Joi = require("joi");

router.use(setUserData);

const patientSchema = Joi.object({
  patient_id: Joi.string().required(),
  rhu_id: Joi.number().integer(),
  //nurse
  last_name: Joi.string().required(),
  first_name: Joi.string().required(),
  middle_name: Joi.string().allow('').optional(),
  suffix: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  gender: Joi.string().required(),
  birthdate: Joi.date().required(),
  age: Joi.number().integer().allow('').optional(),
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
  bmi: Joi.number().required(),
  comment: Joi.string().allow('').optional(),
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
  res.render("nurse/patient-registration"); // Render the EJS view
});

router.get("/nurse/patient-registration/new-id", ensureAuthenticated, checkUserType("Nurse"), async (req, res) => {
  try {
    const result = await rhuPool.query(
      "SELECT patient_id FROM patients ORDER BY patient_id DESC LIMIT 1"
    );

    let lastId = "A0000"; // Default in case there are no patients

    if (result.rows.length > 0) {
      lastId = result.rows[0].patient_id;

      // Check if the last ID has a prefix
      const prefixMatch = lastId.match(/^([A-Z]+)(\d+)$/);

      if (!prefixMatch) {
        // Handle IDs without a prefix or in a different format
        const numericPart = parseInt(lastId, 10) || 0;
        lastId = `A${String(numericPart).padStart(4, "0")}`;
      }
    }

    // Generate the next ID
    const newId = generateNextId(lastId);

    res.json({ id: newId }); // Return the generated ID as JSON
  } catch (err) {
    console.error("Error generating ID:", err.message);
    res.status(500).send("Server error");
  }
});

router.get("/nurse/individual-health-assessment", ensureAuthenticated, checkUserType("Nurse"), (req, res) => {
  res.render("nurse/individual-health-assessment");
});

router.get("/nurse/recently-added-patients", async (req, res) => {
  try {

  } catch (err) {
    console.error("Error: ", err);
  }
})



router.get("/scanner", (req, res) => {
  res.render('nurse/qrScanner');
});

router.get("/nurse/fetchScannedData", async (req, res) => {
  const { qrCode } = req.query;
  console.log('Received scanned QR Code:', qrCode);

  try {
    // First query for the beneficiary table in the pharmacy database
    const beneficiaryQueryText = `
      SELECT * FROM beneficiary
      WHERE beneficiary_id = $1
    `;

    const beneficiaryResult = await pharmacyPool.query(beneficiaryQueryText, [qrCode]);

    if (beneficiaryResult.rows.length > 0) {
      // If found in beneficiary table
      res.json(beneficiaryResult.rows[0]);
    } else {
      console.log(`User not found for beneficiary_id=${qrCode}`);

      // If not found in beneficiary table, query the patients table in the patients database
      const patientQueryText = `
        SELECT * FROM patients
        WHERE patient_id = $1
      `;

      const patientResult = await rhuPool.query(patientQueryText, [qrCode]);

      if (patientResult.rows.length > 0) {
        // If found in patients table
        res.json(patientResult.rows[0]);
      } else {
        // If not found in both tables
        res.status(404).send("User not found");
      }
    }
  } catch (err) {
    console.error("Error querying database:", err.message);
    res.status(500).send("Server error");
  }
});

router.post("/nurse/admit-patient", async (req, res) => {
  const { error, value } = patientSchema.validate(req.body);
  console.log(value);
  console.log(calculateAge(value.birthdate))
  const rhu_id = req.user.rhu_id;

  // Extract address components from completeAddress
  const addressParts = value.completeAddress.split(',');
  const [house_no, street, barangay, city, province] = addressParts.map(part => part.trim());

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Check if the patient already exists in the patients table
    const patientExistsQuery = `
      SELECT * FROM patients WHERE patient_id = $1
    `;
    const patientExistsResult = await rhuPool.query(patientExistsQuery, [value.patient_id]);

    if (patientExistsResult.rows.length > 0) {
      // Patient exists, move existing data to patient_history
      const patientData = patientExistsResult.rows[0];

      // Move data from nurse_checks
      const nurseChecksQuery = `
        SELECT * FROM nurse_checks WHERE patient_id = $1
      `;
      const nurseChecksResult = await rhuPool.query(nurseChecksQuery, [value.patient_id]);

      // Move data from doctor_visits
      const doctorVisitsQuery = `
        SELECT * FROM doctor_visits WHERE patient_id = $1
      `;
      const doctorVisitsResult = await rhuPool.query(doctorVisitsQuery, [value.patient_id]);

      // Move data from medtech_labs
      const medtechLabsQuery = `
        SELECT * FROM medtech_labs WHERE patient_id = $1
      `;
      const medtechLabsResult = await rhuPool.query(medtechLabsQuery, [value.patient_id]);

      // Insert into patient_history
      await rhuPool.query(`
        INSERT INTO patient_history (patient_id, rhu_id, last_name, first_name, middle_name, suffix, phone, gender, birthdate,
            house_no, street, barangay, city, province, occupation, email, philhealth_no, guardian, 
            age, check_date, height, weight, systolic, diastolic, temperature, heart_rate, 
            respiratory_rate, bmi, comment, follow_date, diagnosis, findings, category, 
            service, medicine, instruction, quantity, lab_result)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24, $25, $26, 
            $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38)
      `, [
        patientData.patient_id, patientData.rhu_id, patientData.last_name, patientData.first_name,
        patientData.middle_name, patientData.suffix, patientData.phone, patientData.gender,
        patientData.birthdate, house_no, street, barangay, city, province, patientData.occupation,
        patientData.email, patientData.philhealth_no, patientData.guardian,
        calculateAge(value.birthdate), value.check_date, value.height, value.weight,
        value.systolic, value.diastolic, value.temperature, value.heart_rate,
        value.respiratory_rate, value.bmi, value.comment,
        value.follow_date, value.diagnosis, value.findings, value.category,
        value.service, value.medicine, value.instruction, value.quantity, value.lab_result
      ]);

      // Delete the records from the original tables
      await rhuPool.query(`DELETE FROM nurse_checks WHERE patient_id = $1`, [value.patient_id]);
      await rhuPool.query(`DELETE FROM doctor_visits WHERE patient_id = $1`, [value.patient_id]);
      await rhuPool.query(`DELETE FROM medtech_labs WHERE patient_id = $1`, [value.patient_id]);


      // Insert new data into nurse_checks, doctor_visits, and medtech_labs
      if (value.age !== undefined) { // Check if age is provided
        await rhuPool.query(`
          INSERT INTO nurse_checks (patient_id, age, check_date, height, weight, systolic, diastolic, temperature,
              heart_rate, respiratory_rate, bmi, comment)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          value.patient_id, value.age, value.check_date,
          value.height, value.weight, value.systolic, value.diastolic,
          value.temperature, value.heart_rate, value.respiratory_rate,
          value.bmi, value.comment
        ]);
      }

      if (value.diagnosis) { // Check if diagnosis is provided
        await rhuPool.query(`
          INSERT INTO doctor_visits (patient_id, follow_date, diagnosis, findings, category, service, medicine, instruction, quantity)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          value.patient_id, value.follow_date, value.diagnosis,
          value.findings, value.category, value.service,
          value.medicine, value.instruction, value.quantity
        ]);
      }

      if (value.lab_result) { // Check if lab_result is provided
        await rhuPool.query(`
          INSERT INTO medtech_labs (patient_id, lab_result)
          VALUES ($1, $2)
        `, [
          value.patient_id, value.lab_result
        ]);
      }
      req.flash("submit", "Submitted Successfully");
      return res.redirect("/nurse/patient-registration");
    } else {
      // Patient does not exist, insert new patient and vital signs
      await rhuPool.query(`
        INSERT INTO patients (patient_id, rhu_id, last_name, first_name, middle_name, suffix, phone, gender, birthdate,
            house_no, street, barangay, city, province, occupation, email, philhealth_no, guardian)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        value.patient_id, rhu_id, value.last_name, value.first_name,
        value.middle_name, value.suffix, value.phone, value.gender,
        value.birthdate, house_no, street, barangay, city, province,
        value.occupation, value.email, value.philhealth_no, value.guardian
      ]);

      await rhuPool.query(`
        INSERT INTO nurse_checks (patient_id, age, check_date, height, weight, systolic, diastolic, temperature,
            heart_rate, respiratory_rate, bmi, comment)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        value.patient_id, calculateAge(value.birthdate), value.check_date,
        value.height, value.weight, value.systolic, value.diastolic,
        value.temperature, value.heart_rate, value.respiratory_rate,
        value.bmi, value.comment
      ]);
    }
    req.flash("submit", "Submitted Successfully");
    return res.redirect("/nurse/patient-registration");
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).send("Server error");
  }

});

//-------------------functions------//
function generateNextId(lastId) {
  const match = lastId.match(/^([A-Z]+)(\d+)$/);

  if (match) {
    const prefix = match[1]; // Get the letter part (e.g., "A")
    const number = parseInt(match[2], 10); // Get the number part (e.g., "0001")

    const newNumber = number + 1; // Increment the numeric part
    return `${prefix}${String(newNumber).padStart(4, '0')}`; // Return the new ID with padding
  }

  return "A0001"; // Default in case something goes wrong
}

module.exports = router;