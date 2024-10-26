const express = require("express");
const router = express.Router();
const rhuPool = require("../../models/rhudb");
const pharmacyPool = require("../../models/pharmacydb");
const {
  setUserData,
  ensureAuthenticated,
  checkUserType,
} = require("../../middlewares/middleware");
const methodOverride = require("method-override");
const {
  calculateAge,
  formatDate,
} = require("../../public/js/global/functions");
const Joi = require("joi");

router.use(setUserData);
router.use(methodOverride("_method"));

const patientSchema = Joi.object({
  patient_id: Joi.string().required(),
  rhu_id: Joi.number().integer(),
  last_name: Joi.string().required(),
  first_name: Joi.string().required(),
  middle_name: Joi.string().allow("").optional(),
  suffix: Joi.string().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  gender: Joi.string().required(),
  birthdate: Joi.date().required(),
  age: Joi.number().integer().allow("").optional(),
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

router.get(
  "/nurse-dashboard",
  ensureAuthenticated,
  checkUserType("Nurse"),
  (req, res) => {
    res.render("nurse/nurse-dashboard", { user: req.user });
  }
);

router.get(
  "/nurse/patient-registration",
  ensureAuthenticated,
  checkUserType("Nurse"),
  (req, res) => {
    res.render("nurse/patient-registration", { user: req.user });
  }
);

router.get(
  "/nurse/patient-registration/recently-added",
  ensureAuthenticated,
  checkUserType("Nurse"),
  async (req, res) => {
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

router.get(
  "/nurse/patient-registration/new-id",
  ensureAuthenticated,
  checkUserType("Nurse"),
  async (req, res) => {
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

router.get(
  "/nurse/individual-health-assessment",
  ensureAuthenticated,
  checkUserType("Nurse"),
  (req, res) => {
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
  const addressParts = value.completeAddress.split(",");
  const [house_no, street, barangay, city, province] = addressParts.map(
    (part) => part.trim()
  );

  if (error) {
    console.error("Validation error:", error.details[0].message);
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    console.log("Beginning transaction for patient admission");
    // Begin a transaction to ensure atomicity
    await rhuPool.query("BEGIN");

    // Check if the patient already exists
    console.log("Checking if patient exists with ID:", value.patient_id);
    const patientExistsQuery = `SELECT * FROM patients WHERE patient_id = $1`;
    const patientExistsResult = await rhuPool.query(patientExistsQuery, [
      value.patient_id,
    ]);

    if (patientExistsResult.rows.length > 0) {
      console.log("Patient exists. Migrating data to history tables.");
      const patientData = patientExistsResult.rows[0];

      // Fetch related data in parallel
      console.log("Fetching related nurse checks, doctor visits, and lab results for patient ID:", value.patient_id);
      const [nurseChecksResult, doctorVisitsResult, medtechLabsResult] =
        await Promise.all([
          rhuPool.query(`SELECT * FROM nurse_checks WHERE patient_id = $1`, [
            value.patient_id,
          ]),
          rhuPool.query(`SELECT * FROM doctor_visits WHERE patient_id = $1`, [
            value.patient_id,
          ]),
          rhuPool.query(`SELECT * FROM medtech_labs WHERE patient_id = $1`, [
            value.patient_id,
          ]),
        ]);

      // Prepare data for patient_history insertion
      const historyInsertQuery = `
        INSERT INTO patient_history (patient_id, rhu_id, last_name, first_name, middle_name, suffix, phone, gender, birthdate, age,
            house_no, street, barangay, city, province, occupation, email, philhealth_no, guardian, 
            check_date, height, weight, systolic, diastolic, temperature, heart_rate, 
            respiratory_rate, bmi, comment, follow_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
        RETURNING id
      `;

      const nurseCheck = nurseChecksResult.rows[0];
      const doctorVisit = doctorVisitsResult.rows[0];

      console.log("Inserting into patient_history for patient ID:", patientData.patient_id);
      const historyInsertResult = await rhuPool.query(historyInsertQuery, [
        patientData.patient_id,
        patientData.rhu_id,
        patientData.last_name,
        patientData.first_name,
        patientData.middle_name,
        patientData.suffix,
        patientData.phone,
        patientData.gender,
        patientData.birthdate,
        nurseCheck ? nurseCheck.age : null,
        patientData.house_no,
        patientData.street,
        patientData.barangay,
        patientData.city,
        patientData.province,
        patientData.occupation,
        patientData.email,
        patientData.philhealth_no,
        patientData.guardian,
        nurseCheck ? nurseCheck.check_date : null,
        nurseCheck ? nurseCheck.height : null,
        nurseCheck ? nurseCheck.weight : null,
        nurseCheck ? nurseCheck.systolic : null,
        nurseCheck ? nurseCheck.diastolic : null,
        nurseCheck ? nurseCheck.temperature : null,
        nurseCheck ? nurseCheck.heart_rate : null,
        nurseCheck ? nurseCheck.respiratory_rate : null,
        nurseCheck ? nurseCheck.bmi : null,
        nurseCheck ? nurseCheck.comment : null,
        doctorVisit ? doctorVisit.follow_date : null,
      ]);

      const historyId = historyInsertResult.rows[0]?.id;

      if (!historyId) {
        throw new Error("Failed to insert into patient_history");
      }

      // Insert lab results in batch
      if (medtechLabsResult.rows.length > 0) {
        console.log("Inserting lab results for history ID:", historyId);
        const labInsertPromises = medtechLabsResult.rows.map((lab) =>
          rhuPool.query(
            `
              INSERT INTO patient_lab_results (history_id, lab_result)
              VALUES ($1, $2)
            `,
            [historyId, lab.lab_result]
          )
        );
        await Promise.all(labInsertPromises);
      } else {
        console.log("No lab results found for patient ID:", value.patient_id);
      }

      // Insert prescriptions and services in batch
      if (doctorVisitsResult.rows.length > 0) {
        console.log("Inserting prescriptions and services for patient ID:", value.patient_id);
        const visitInsertPromises = doctorVisitsResult.rows.map(async (visit) => {
          const medicines = visit.medicine ? visit.medicine.split(",") : [];
          const instructions = visit.instruction ? visit.instruction.split(",") : [];
          const quantities = visit.quantity ? visit.quantity.split(",") : [];

          const prescriptionInserts = medicines.map((med, i) =>
            rhuPool.query(
              `
                INSERT INTO patient_prescriptions (history_id, medicine, instruction, quantity)
                VALUES ($1, $2, $3, $4)
              `,
              [historyId, med, instructions[i], quantities[i]]
            )
          );

          const services = visit.service ? visit.service.split(",") : [];
          const categories = visit.category ? visit.category.split(",") : [];

          const serviceInserts = services.map((service, i) =>
            rhuPool.query(
              `
                INSERT INTO patient_services (history_id, service, category)
                VALUES ($1, $2, $3)
              `,
              [historyId, service, categories[i]]
            )
          );

          await Promise.all([...prescriptionInserts, ...serviceInserts]);
        });

        await Promise.all(visitInsertPromises);
      } else {
        console.log("No doctor visits found for patient ID:", value.patient_id);
      }

      // Check if there are any nurse check records before deletion
      const nurseCheckExistsQuery = `SELECT * FROM nurse_checks WHERE patient_id = $1`;
      const nurseCheckExistsResult = await rhuPool.query(nurseCheckExistsQuery, [value.patient_id]);

      console.log(`Nurse checks found for patient ID ${value.patient_id}:`, nurseCheckExistsResult.rowCount);
      console.log('Existing nurse checks for patient:', nurseCheckExistsResult.rows);

      // Delete old data with logging
      const deletePatientQuery = `DELETE FROM patients WHERE patient_id = $1`;
      const deleteNurseChecksQuery = `DELETE FROM nurse_checks WHERE patient_id = $1`;
      const deleteDoctorVisitsQuery = `DELETE FROM doctor_visits WHERE patient_id = $1`;
      const deleteMedtechLabsQuery = `DELETE FROM medtech_labs WHERE patient_id = $1`;

      try {
        console.log(`Attempting to delete patient with ID: ${value.patient_id}`);
      
        // Delete old data sequentially
        await executeWithRetry(rhuPool.query.bind(rhuPool), deletePatientQuery, [value.patient_id]);
        await executeWithRetry(rhuPool.query.bind(rhuPool), deleteNurseChecksQuery, [value.patient_id]);
        await executeWithRetry(rhuPool.query.bind(rhuPool), deleteDoctorVisitsQuery, [value.patient_id]);
        await executeWithRetry(rhuPool.query.bind(rhuPool), deleteMedtechLabsQuery, [value.patient_id]);
        
        console.log("Old data deleted successfully.");
      } catch (err) {
        console.error("Error during deletion:", err);
        await rhuPool.query("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }      

      // Log results of each deletion
      deleteResults.forEach((result, index) => {
        console.log(`Delete result for query ${index + 1}:`, result.rowCount);
      });

      // Check for rows that could not be deleted
      const deletionFailures = deleteResults.filter(result => result.rowCount === 0);
      if (deletionFailures.length > 0) {
        console.error("Some old data could not be deleted during migration:", deletionFailures);
      }

      // Insert new patient record
      console.log("Inserting new patient record for ID:", value.patient_id);
      await rhuPool.query(
        `
          INSERT INTO patients (patient_id, rhu_id, last_name, first_name, middle_name, suffix, phone, gender, birthdate,
              house_no, street, barangay, city, province, occupation, email, philhealth_no, guardian)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
              $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `,
        [
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
        ]
      );

      console.log("Inserting new nurse checks for patient ID:", value.patient_id);
      // Insert new nurse checks
      await insertNurseChecks(value, nurse_id);

      await rhuPool.query("COMMIT");

      req.flash("submit", "Submitted Successfully");
      return res.redirect("/nurse/patient-registration");
    } else {
      console.log("New patient case. Inserting new patient data.");
      // New patient case
      await rhuPool.query(
        `
          INSERT INTO patients (patient_id, rhu_id, last_name, first_name, middle_name, suffix, phone, gender, birthdate,
              house_no, street, barangay, city, province, occupation, email, philhealth_no, guardian)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
              $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `,
        [
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
        ]
      );

      console.log("Inserting new nurse checks for patient ID:", value.patient_id);
      // Insert new nurse checks
      await insertNurseChecks(value, nurse_id);

      await rhuPool.query("COMMIT");

      req.flash("submit", "Patient Added Successfully");
      return res.redirect("/nurse/patient-registration");
    }
  } catch (err) {
    await rhuPool.query("ROLLBACK");
    console.error("Error occurred during migration:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Function to insert nurse checks
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

async function executeWithRetry(queryFn, params, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await queryFn(params);
    } catch (error) {
      if (attempt < retries - 1 && error.code === '40P01') {
        console.warn(`Deadlock detected, retrying... (Attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait before retrying
      } else {
        throw error; // Rethrow the error if it's not a deadlock or max retries reached
      }
    }
  }
}

router.delete("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
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
          MAX(nc.check_date) AS check_date,
          r.rhu_name,
          nc.nurse_name AS nurse
        FROM patients p
        LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        WHERE r.rhu_id = $3
        GROUP BY p.patient_id, r.rhu_name, nc.nurse_name
        ORDER BY p.first_name
        LIMIT $1 OFFSET $2
      `;
      queryParams.push(rhuId);

      // Count query for total items
      countQuery = `
        SELECT COUNT(*) AS total
        FROM patients p
        LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        WHERE r.rhu_id = $1
      `;
    } else {
      query = `
        SELECT
          p.patient_id,
          p.rhu_id,
          p.last_name,
          p.first_name,
          MAX(nc.check_date) AS check_date,
          r.rhu_name,
          nc.nurse_name AS nurse
        FROM patients p
        LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        GROUP BY p.patient_id, r.rhu_name, nc.nurse_name
        ORDER BY p.first_name
        LIMIT $1 OFFSET $2
      `;

      // Count query for total items
      countQuery = `
        SELECT COUNT(*) AS total
        FROM patients p
        LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
      `;
    }

    const patientListResult = await rhuPool.query(query, queryParams);
    const countResult = await rhuPool.query(countQuery, rhuId ? [rhuId] : []);

    const formattedPatientList = patientListResult.rows.map(formatPatientData);
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

function formatPatientData(patient) {
  return {
    patient_id: patient.patient_id,
    first_name: patient.first_name,
    last_name: patient.last_name,
    check_date: patient.check_date
      ? new Date(patient.check_date).toLocaleDateString()
      : "N/A",
    nurse: patient.nurse || "N/A",
  };
}

module.exports = router;
