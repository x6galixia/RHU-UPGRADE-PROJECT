const express = require("express");
const router = express.Router();
const rhuPool = require("../../models/rhudb");
const pharmacyPool = require("../../models/pharmacydb");
const fs = require('fs').promises;
const path = require('path');
const { setUserData, ensureAuthenticated, checkUserType, } = require("../../middlewares/middleware");
const methodOverride = require("method-override");
const { calculateAge, formatDate, } = require("../../public/js/global/functions");
const Joi = require("joi");

router.use(setUserData);
router.use(methodOverride("_method"));

const patientSchema = Joi.object({
  user_name: Joi.string().required(),
  patient_id: Joi.string().required(),
  rhu_id: Joi.number().integer(),
  last_name: Joi.string().required(),
  first_name: Joi.string().required(),
  middle_name: Joi.string().allow("").optional(),
  suffix: Joi.string().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  gender: Joi.string().required(),
  birthdate: Joi.date().required(),
  completeAddress: Joi.string().required(),
  occupation: Joi.string().allow("").optional(),
  email: Joi.string().allow("").optional(),
  philhealth_no: Joi.string().allow("").optional(),
  guardian: Joi.string().allow("").optional(),
  check_date: Joi.date().required(),
  height: Joi.number().integer().required(),
  weight: Joi.number().integer().required(),
  systolic: Joi.number().integer().required(),
  diastolic: Joi.number().integer().required(),
  temperature: Joi.number().integer().required(),
  heart_rate: Joi.number().integer().required(),
  respiratory_rate: Joi.number().integer().required(),
  bmi: Joi.number().required(),
  comment: Joi.string().allow("").optional(),
});

router.get("/nurse-dashboard", ensureAuthenticated, checkUserType("Nurse"), (req, res) => {
  res.render("nurse/nurse-dashboard", { user: req.user });
}
);

router.get("/nurse/patient-registration", ensureAuthenticated, checkUserType("Nurse"), (req, res) => {
  res.render("nurse/patient-registration", { user: req.user });
}
);

router.get("/nurse/patient-registration/recently-added", ensureAuthenticated, checkUserType("Nurse"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const isAjax = req.query.ajax === "true";
  const rhuId = req.query.rhu_id;

  try {
    const { getPatientList, totalPages } = await fetchPatientList(
      page,
      limit,
      rhuId
    );

    if (isAjax) {
      return res.json({
        getPatientList,
        user: req.user,
        currentPage: page,
        totalPages,
        limit,
      });
    }
  } catch (err) {
    console.error("Error: ", err.message, err.stack);
    res.status(500).send("Internal server error");
  }
}
);

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
}
);

router.get("/nurse/individual-health-assessment", ensureAuthenticated, checkUserType("Nurse"), (req, res) => {
  res.render("nurse/individual-health-assessment", { user: req.user });
}
);

router.get("/nurse/fetchScannedData", async (req, res) => {
  const { qrCode } = req.query;
  console.log("Received scanned QR Code:", qrCode);

  try {
    // First query for the beneficiary table in the pharmacy database
    const beneficiaryQueryText = `
      SELECT * FROM beneficiary
      WHERE beneficiary_id = $1
    `;

    const beneficiaryResult = await pharmacyPool.query(beneficiaryQueryText, [
      qrCode,
    ]);

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
  const rhu_id = req.user.rhu_id;
  const nurse_id = req.user.id;

  // Extract address components from completeAddress
  const addressParts = value.completeAddress.split(",").map(part => part.trim());
  const [house_no, street, barangay, city, province] = addressParts;

  if (error) {
    console.error("Validation error:", error.details[0].message);
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    console.log("Beginning transaction for patient admission");
    await rhuPool.query("BEGIN");

    const patientExistsQuery = `SELECT * FROM patients WHERE patient_id = $1`;
    const patientExistsResult = await rhuPool.query(patientExistsQuery, [value.patient_id]);
    const patientExists = patientExistsResult.rows.length > 0;

    if (patientExists) {
      await handleExistingPatient(value, rhu_id, house_no, street, barangay, city, province, nurse_id, patientExistsResult.rows[0]);
    } else {
      await handleNewPatient(value, rhu_id, house_no, street, barangay, city, province, nurse_id);
    }

    await rhuPool.query("COMMIT");
    req.flash("submit", "Patient Added Successfully");
    return res.redirect("/nurse/patient-registration");
  } catch (err) {
    await rhuPool.query("ROLLBACK");
    console.error("Error during migration:", { message: err.message, stack: err.stack });
    return res.status(500).json({ error: err.message });
  }
});

async function handleExistingPatient(value, rhu_id, house_no, street, barangay, city, province, nurse_id, patientData) {
  console.log("Patient exists. Migrating data to history tables.");
  
  const [nurseChecksResult, doctorVisitsResult, medtechLabsResult] = await Promise.all([
    rhuPool.query(`SELECT * FROM nurse_checks WHERE patient_id = $1`, [value.patient_id]),
    rhuPool.query(`SELECT * FROM doctor_visits WHERE patient_id = $1`, [value.patient_id]),
    rhuPool.query(`SELECT * FROM medtech_labs WHERE patient_id = $1`, [value.patient_id]),
  ]);

  const historyId = await insertPatientHistory(patientData, nurseChecksResult, doctorVisitsResult, rhu_id, house_no, street, barangay, city, province);
  
  await insertLabResults(historyId, medtechLabsResult);
  await insertVisitData(historyId, doctorVisitsResult);
  
  console.log("Attempting to delete old records for patient ID:", value.patient_id);
  await deleteOldRecords(value.patient_id);
  
  console.log("Updating existing patient record for ID:", value.patient_id);
  await updatePatientRecord(value, rhu_id, house_no, street, barangay, city, province);
  
  console.log("Inserting new nurse checks for patient ID:", value.patient_id);
  await insertNurseChecks(value, nurse_id);
}

async function handleNewPatient(value, rhu_id, house_no, street, barangay, city, province, nurse_id) {
  console.log("New patient case. Inserting new patient data.");
  await insertPatientRecord(value, rhu_id, house_no, street, barangay, city, province);
  console.log("Inserting new nurse checks for patient ID:", value.patient_id);
  await insertNurseChecks(value, nurse_id);
}

async function insertPatientHistory(patientData, nurseChecksResult, doctorVisitsResult, rhu_id, house_no, street, barangay, city, province) {
  try {
    const historyInsertQuery = `
      INSERT INTO patient_history (
        patient_id, rhu_id, doctor_id, last_name, first_name, middle_name, suffix, phone,
        gender, birthdate, age, house_no, street, barangay, city, province, occupation, email,
        philhealth_no, guardian, check_date, height, weight, systolic, diastolic, temperature,
        heart_rate, respiratory_rate, bmi, comment, follow_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
      RETURNING id
    `;

    const nurseCheck = nurseChecksResult.rows[0] || {};
    const doctorVisit = doctorVisitsResult.rows[0] || {};

    console.log("Inserting into patient_history for patient ID:", patientData.patient_id);
    const historyInsertResult = await rhuPool.query(historyInsertQuery, [
      patientData.patient_id,
      rhu_id,
      doctorVisit.doctor_id || null,
      patientData.last_name,
      patientData.first_name,
      patientData.middle_name,
      patientData.suffix,
      patientData.phone,
      patientData.gender,
      patientData.birthdate,
      nurseCheck.age || null,
      house_no,
      street,
      barangay,
      city,
      province,
      patientData.occupation,
      patientData.email,
      patientData.philhealth_no,
      patientData.guardian,
      nurseCheck.check_date || null,
      nurseCheck.height || null,
      nurseCheck.weight || null,
      nurseCheck.systolic || null,
      nurseCheck.diastolic || null,
      nurseCheck.temperature || null,
      nurseCheck.heart_rate || null,
      nurseCheck.respiratory_rate || null,
      nurseCheck.bmi || null,
      nurseCheck.comment || null,
      doctorVisit.follow_date || null,
    ]);

    const historyId = historyInsertResult.rows[0]?.id;
    if (!historyId) throw new Error("Failed to insert into patient_history, historyId is undefined.");
    return historyId;

  } catch (err) {
    console.error("Error inserting patient history:", err.message);
    throw err; // Re-throwing error to be caught in the transaction block
  }
}

async function insertLabResults(historyId, medtechLabsResult) {
  if (medtechLabsResult.rows.length > 0) {
    console.log("Inserting lab results for history ID:", historyId);
    const labInsertPromises = medtechLabsResult.rows.map(lab =>
      rhuPool.query(`INSERT INTO patient_lab_results (history_id, lab_result) VALUES ($1, $2)`, [historyId, lab.lab_result])
    );
    await Promise.all(labInsertPromises);
  } else {
    console.log("No lab results found for patient ID.");
  }
}

async function insertVisitData(historyId, doctorVisitsResult) {
  if (doctorVisitsResult.rows.length > 0) {
    console.log("Inserting prescriptions and services for patient ID:");
    const visitInsertPromises = doctorVisitsResult.rows.map(async visit => {
      // Handle prescriptions
      await insertPrescriptions(historyId, visit);
      // Handle services
      await insertServices(historyId, visit);
    });

    await Promise.all(visitInsertPromises);
  } else {
    console.log("No doctor visits found for patient ID.");
  }
}

async function insertPrescriptions(historyId, visit) {
  const medicines = visit.medicine ? visit.medicine.split(",") : [];
  const instructions = visit.instruction ? visit.instruction.split(",") : [];
  const quantities = Array(medicines.length).fill(visit.quantity);

  const prescriptionInserts = medicines.map((med, i) =>
    rhuPool.query(`INSERT INTO patient_prescriptions (history_id, medicine, instruction, quantity) VALUES ($1, $2, $3, $4)`, [historyId, med, instructions[i], quantities[i]])
  );

  await Promise.all(prescriptionInserts);
}

async function insertServices(historyId, visit) {
  const services = visit.service ? visit.service.split(",") : [];
  const categories = visit.category ? visit.category.split(",") : [];

  const serviceInserts = services.map((service, i) =>
    rhuPool.query(`INSERT INTO patient_services (history_id, service, category) VALUES ($1, $2, $3)`, [historyId, service, categories[i]])
  );

  await Promise.all(serviceInserts);
}

async function deleteOldRecords(patientId) {
  await Promise.all([
    rhuPool.query(`DELETE FROM medtech_labs WHERE patient_id = $1`, [patientId]),
    rhuPool.query(`DELETE FROM doctor_visits WHERE patient_id = $1`, [patientId]),
    rhuPool.query(`DELETE FROM nurse_checks WHERE patient_id = $1`, [patientId])
  ]);
  console.log("Old records deleted successfully.");
}

async function updatePatientRecord(value, rhu_id, house_no, street, barangay, city, province) {
  await rhuPool.query(`
    UPDATE patients
    SET
      rhu_id = $1,
      last_name = $2,
      first_name = $3,
      middle_name = $4,
      suffix = $5,
      phone = $6,
      gender = $7,
      birthdate = $8,
      house_no = $9,
      street = $10,
      barangay = $11,
      city = $12,
      province = $13,
      occupation = $14,
      email = $15,
      philhealth_no = $16,
      guardian = $17
    WHERE patient_id = $18
  `, [
    rhu_id,
    value.last_name,
    value.first_name,
    value.middle_name,
    value.suffix,
    value.phone,
    value.gender,
    value.birthdate,
    house_no,
    street,
    barangay,
    city,
    province,
    value.occupation,
    value.email,
    value.philhealth_no,
    value.guardian,
    value.patient_id,
  ]);
}

async function insertPatientRecord(value, rhu_id, house_no, street, barangay, city, province) {
  const insertQuery = `
    INSERT INTO patients (patient_id, rhu_id, last_name, first_name, middle_name, suffix, phone, gender, birthdate,
        house_no, street, barangay, city, province, occupation, email, philhealth_no, guardian)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18)
  `;

  await rhuPool.query(insertQuery, [
    value.patient_id,
    rhu_id,
    value.last_name,
    value.first_name,
    value.middle_name,
    value.suffix,
    value.phone,
    value.gender,
    value.birthdate,
    house_no,
    street,
    barangay,
    city,
    province,
    value.occupation,
    value.email,
    value.philhealth_no,
    value.guardian,
  ]);
}

async function insertNurseChecks(value, nurse_id) {
  const nurseCheckInsertQuery = `
    INSERT INTO nurse_checks (patient_id, nurse_id, age, check_date, height, weight, systolic, diastolic, temperature, heart_rate, respiratory_rate, bmi, comment)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  `;

  console.log("Inserting nurse check data for patient ID:", value.patient_id);
  await rhuPool.query(nurseCheckInsertQuery, [
    value.patient_id,
    nurse_id,
    calculateAge(value.birthdate),
    new Date(),
    value.height,
    value.weight,
    value.systolic,
    value.diastolic,
    value.temperature,
    value.heart_rate,
    value.respiratory_rate,
    value.bmi,
    value.comment,
  ]);
}

router.post("/nurse/update-patient-details", async (req, res) => {
  const { error, value } = patientSchema.validate(req.body);
  const rhu_id = req.user.rhu_id;
  const nurse_id = req.user.id;

  // Extract address components from completeAddress
  const addressParts = value.completeAddress.split(",").map(part => part.trim());
  const [house_no, street, barangay, city, province] = addressParts;

  if (error) {
    console.error("Validation error:", error.details[0].message);
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    await rhuPool.query(`
      UPDATE patients
      SET rhu_id = $1, last_name = $2, first_name = $3, middle_name = $4, suffix = $5, phone = $6, gender = $7, birthdate = $8, house_no = $9, street = $10, barangay = $11, city = $12, province = $13, occupation = $14, email = $15, philhealth_no = $16, guardian = $17
      WHERE patient_id = $18
    `, [rhu_id, value.last_name, value.first_name, value.middle_name, value.suffix, value.phone, value.gender, value.birthdate, house_no, street, barangay, city, province, value.occupation, value.email, value.philhealth_no, value.guardian, value.patient_id,
    ]);

    await rhuPool.query(`
      UPDATE nurse_checks
      SET 
        nurse_id = $1, 
        age = $2, 
        check_date = $3, 
        height = $4, 
        weight = $5, 
        systolic = $6, 
        diastolic = $7, 
        temperature = $8, 
        heart_rate = $9, 
        respiratory_rate = $10, 
        bmi = $11, 
        comment = $12
      WHERE patient_id = $13
    `, [nurse_id, calculateAge(value.birthdate), new Date(), value.height, value.weight, value.systolic, value.diastolic, value.temperature, value.heart_rate, value.respiratory_rate, value.bmi, value.comment, value.patient_id]);
    req.flash("submit", "Patient Updated Successfully");
    return res.redirect("/nurse/patient-registration");
  } catch (err) {
    req.flash("error", err);
    return res.redirect("/nurse/patient-registration");
  }
});

router.delete('/nurse/patient-registration/delete/:id', async (req, res) => {
  const patientId = req.params.id;
  console.log('Received DELETE request for patient ID:', patientId);

  try {
    // Check existence in both tables
    const patientInPatients = await rhuPool.query(
      'SELECT 1 FROM patients WHERE patient_id = $1',
      [patientId]
    );

    const patientInNurseChecks = await rhuPool.query(
      'SELECT 1 FROM nurse_checks WHERE patient_id = $1',
      [patientId]
    );

    // Delete from `patients` table if exists
    if (patientInPatients.rowCount > 0) {
      await rhuPool.query('DELETE FROM patients WHERE patient_id = $1', [patientId]);
    }

    // Delete from `nurse_checks` table if exists
    if (patientInNurseChecks.rowCount > 0) {
      await rhuPool.query('DELETE FROM nurse_checks WHERE patient_id = $1', [patientId]);
    }

    if (patientInPatients.rowCount > 0 || patientInNurseChecks.rowCount > 0) {
      res.json({ message: 'Patient records deleted successfully from applicable tables.' });
    } else {
      res.status(404).json({ message: 'Patient record not found in any table.' });
    }

  } catch (error) {
    console.error('Error deleting patient records:', error);

    res.status(500).json({ message: 'Failed to delete the patient records.' });
  }
});

router.delete("/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/user/login");
    });
  });
});

//-------------------functions------//
function generateNextId(lastId) {
  const match = lastId.match(/^([A-Z]+)(\d+)$/);

  if (match) {
    const prefix = match[1]; // Get the letter part (e.g., "A")
    const number = parseInt(match[2], 10); // Get the number part (e.g., "0001")

    const newNumber = number + 1; // Increment the numeric part
    return `${prefix}${String(newNumber).padStart(4, "0")}`; // Return the new ID with padding
  }

  return "A0001"; // Default in case something goes wrong
}

async function fetchPatientList(page, limit, rhuId) {
  const offset = (page - 1) * limit;

  try {
    let query;
    let queryParams = [limit, offset];
    let countQuery;

    if (rhuId) {
      query = `
        SELECT
          p.patient_id,
          p.rhu_id,
          p.last_name,
          p.first_name,
          p.middle_name,
          p.suffix,
          p.phone,
          p.gender,
          p.birthdate,
          p.house_no,
          p.street,
          p.barangay,
          p.city,
          p.province,
          p.occupation,
          p.email,
          p.philhealth_no,
          p.guardian,
          MAX(nc.patient_id) AS patient_id,
          MAX(nc.nurse_id) AS nurse_id,
          MAX(nc.age) AS age,
          MAX(nc.check_date) AS check_date,
          MAX(nc.height) AS height,
          MAX(nc.weight) AS weight,
          MAX(nc.systolic) AS systolic,
          MAX(nc.diastolic) AS diastolic,
          MAX(nc.temperature) AS temperature,
          MAX(nc.heart_rate) AS heart_rate,
          MAX(nc.respiratory_rate) AS respiratory_rate,
          MAX(nc.bmi) AS bmi,
          MAX(nc.comment) AS comment,
          r.rhu_name,
          CONCAT(u.firstname, ' ', u.surname) AS nurse_name
        FROM patients p
        LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        LEFT JOIN users u ON nc.nurse_id = u.id
        WHERE r.rhu_id = $3
        GROUP BY p.patient_id, r.rhu_name, u.firstname, u.surname
        ORDER BY p.first_name
        LIMIT $1 OFFSET $2
      `;
      queryParams.push(rhuId);

      countQuery = `
        SELECT COUNT(*) AS total
        FROM patients p
        LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        LEFT JOIN users u ON nc.nurse_id = u.id
        WHERE r.rhu_id = $1
      `;
    } else {
      query = `
        SELECT
          p.patient_id,
          p.rhu_id,
          p.last_name,
          p.first_name,
          p.middle_name,
          p.suffix,
          p.phone,
          p.gender,
          p.birthdate,
          p.house_no,
          p.street,
          p.barangay,
          p.city,
          p.province,
          p.occupation,
          p.email,
          p.philhealth_no,
          p.guardian,
          MAX(nc.patient_id) AS patient_id,
          MAX(nc.nurse_id) AS nurse_id,
          MAX(nc.age) AS age,
          MAX(nc.check_date) AS check_date,
          MAX(nc.height) AS height,
          MAX(nc.height) AS height,
          MAX(nc.systolic) AS systolic,
          MAX(nc.diastolic) AS diastolic,
          MAX(nc.temperature) AS temperature,
          MAX(nc.heart_rate) AS heart_rate,
          MAX(nc.respiratory_rate) AS respiratory_rate,
          MAX(nc.bmi) AS bmi,
          MAX(nc.comment) AS comment,
          r.rhu_name,
          CONCAT(u.firstname, ' ', u.surname) AS nurse_name
        FROM patients p
        LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        LEFT JOIN users u ON nc.nurse_id = u.id
        WHERE r.rhu_id = $3
        GROUP BY p.patient_id, r.rhu_name, u.firstname, u.surname
        ORDER BY p.first_name
        LIMIT $1 OFFSET $2
      `;

      countQuery = `
        SELECT COUNT(*) AS total
        FROM patients p
        LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        LEFT JOIN users u ON nc.nurse_id = u.id
      `;
    }

    const patientListResult = await rhuPool.query(query, queryParams);
    const countResult = await rhuPool.query(countQuery, rhuId ? [rhuId] : []);

    // Adjust mapping here
    const formattedPatientList = patientListResult.rows.map(patient => ({
      ...patient,
      check_date: formatDate(patient.check_date),
      nurse_name: patient.nurse_name || 'N/A', // Use nurse_name directly
    }));

    const totalItems = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      getPatientList: formattedPatientList,
      totalPages,
    };
  } catch (err) {
    console.error("Error fetching patient list:", err.message, err.stack);
    throw new Error("Database query failed");
  }
}

module.exports = router;