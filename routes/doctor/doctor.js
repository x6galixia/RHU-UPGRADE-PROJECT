const express = require("express");
const router = express.Router();
const Joi = require("joi");
const rhuPool = require("../../models/rhudb");
const pharmacyPool = require("../../models/pharmacydb");
const { setUserData, ensureAuthenticated, checkUserType } = require("../../middlewares/middleware");
const methodOverride = require("method-override");
const { formatDate, } = require("../../public/js/global/functions");

router.use(setUserData);
router.use(methodOverride("_method"));

const patientSchema = Joi.object({
  patient_id: Joi.string().required(),
  rhu_id: Joi.number().integer(),
  //nurse
  last_name: Joi.string().allow("").optional(),
  first_name: Joi.string().allow("").optional(),
  middle_name: Joi.string().allow("").optional(),
  suffix: Joi.string().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  gender: Joi.string().allow("").optional(),
  birthdate: Joi.date().allow("").optional(),
  age: Joi.number().integer().allow("").optional(),
  completeAddress: Joi.string().allow("").optional(),
  occupation: Joi.string().allow("").optional(),
  email: Joi.string().allow("").optional(),
  philhealth_no: Joi.string().allow("").optional(),
  guardian: Joi.string().allow("").optional(),
  check_date: Joi.date().allow("").optional(),
  height: Joi.number().integer().allow("").optional(),
  weight: Joi.number().integer().allow("").optional(),
  systolic: Joi.number().integer().allow("").optional(),
  diastolic: Joi.number().integer().allow("").optional(),
  temperature: Joi.number().integer().allow("").optional(),
  heart_rate: Joi.number().integer().allow("").optional(),
  respiratory_rate: Joi.number().integer().allow("").optional(),
  bmi: Joi.number().allow("").optional(),
  comment: Joi.string().allow("").optional(),
  //doctor
  doctor_name: Joi.string().allow("").optional(),
  follow_date: Joi.date().allow("").optional(),
  diagnosis: Joi.string().allow("").optional(),
  findings: Joi.string().allow("").optional(),
  category: Joi.string().allow("").optional(),
  service: Joi.string().allow("").optional(),
  // category: Joi.array().items(Joi.string().allow("")).optional(),
  // service: Joi.array().items(Joi.string().allow("")).optional(),
  medicine: Joi.string().allow("").optional(),
  instruction: Joi.string().allow("").optional(),
  quantity: Joi.string().allow("").optional(),
  receiver: Joi.string().allow("").optional(),
  relationship: Joi.string().allow("").optional(),
  quantity: Joi.string().allow("").optional(),
  doctor: Joi.string().allow("").optional(),
  //medtech
  lab_result: Joi.string().allow("").optional(),
  //inventory
  product_id: Joi.string().allow("").optional(),
  batch_number: Joi.string().allow("").optional()
});

router.get("/doctor-dashboard", ensureAuthenticated, checkUserType("Doctor"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isAjax = req.query.ajax === "true";

  try {
    const { getPatientList, totalPages } = await fetchPatientList(page, limit);

    if (isAjax) {
      return res.json({
        getPatientList,
        user: req.user,
        currentPage: page,
        totalPages,
        limit,
      });
    }

    res.render("doctor/doctor-dashboard", {
      getPatientList,
      user: req.user,
      currentPage: page,
      totalPages,
      limit,
    });
  } catch (err) {
    console.error("Error: ", err.message, err.stack);
    res.status(500).send("Internal server error");
  }
});

router.get("/doctor-dashboard/search", ensureAuthenticated, checkUserType("Doctor"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { query } = req.query;

  try {
    let searchResult;

    // Base query for patients
    const baseQuery = `
      SELECT 
         p.patient_id, p.rhu_id, p.last_name, p.first_name, p.middle_name, p.suffix, p.phone, p.gender,
        p.birthdate, p.house_no, p.street, p.barangay, p.city, p.province, p.occupation, p.email, p.philhealth_no, p.guardian,
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
        MAX(dv.follow_date) AS follow_date,
        COALESCE(MAX(dv.diagnosis), '') AS diagnosis,
        COALESCE(MAX(dv.findings), '') AS findings,
        STRING_AGG(DISTINCT dv.category, ', ') AS categories,
        STRING_AGG(DISTINCT dv.service, ', ') AS services,
        STRING_AGG(DISTINCT dv.medicine, ', ') AS medicines,
        STRING_AGG(DISTINCT dv.instruction, ', ') AS instructions,
        STRING_AGG(DISTINCT dv.quantity::text, ', ') AS quantities,  -- Cast to text here
        STRING_AGG(DISTINCT lr.lab_result, ', ') AS lab_results,  -- Assuming lab_result is already text
        r.rhu_name, r.rhu_address
      FROM patients p
      LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
      LEFT JOIN doctor_visits dv ON p.patient_id = dv.patient_id
      LEFT JOIN medtech_labs lr ON p.patient_id = lr.patient_id
      LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
    `;

    // If no query is provided, fetch all patients with pagination
    if (!query) {
      searchResult = await rhuPool.query(
        `${baseQuery} GROUP BY p.patient_id, r.rhu_name, r.rhu_address ORDER BY p.first_name LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    } else {
      // Search patients based on the query
      searchResult = await rhuPool.query(
        `${baseQuery} 
        WHERE CONCAT(p.first_name, ' ', p.middle_name, ' ', p.last_name, ' ', p.suffix) ILIKE $1
          OR CONCAT(p.house_no, ' ', p.street, ' ', p.barangay, ' ', p.city, ' ', p.province) ILIKE $1
          OR CONCAT(p.first_name, ' ', p.last_name, ' ', p.suffix) ILIKE $1
          OR p.first_name ILIKE $1
          OR p.middle_name ILIKE $1
          OR p.last_name ILIKE $1
          OR p.suffix ILIKE $1
          OR r.rhu_name ILIKE $1
        GROUP BY p.patient_id, r.rhu_name, r.rhu_address
        ORDER BY p.first_name LIMIT $2 OFFSET $3`,
        [`%${query}%`, limit, offset]
      );
    }

    const data = formatPatientData(searchResult.rows);

    if (data.length === 0) {
      return res.json({ message: "No patients found." });
    }

    res.json({ getPatientList: data });
  } catch (err) {
    console.error("Error: ", err.message, err.stack);
    res.status(500).send("An error occurred during the search.");
  }
});

// fetch latestpatient history
router.get("/doctor/patient-histories/:patient_id", ensureAuthenticated, checkUserType("Doctor"), async (req, res) => {
  const { patient_id } = req.params;

  try {
    // Fetch the latest patient history and all check dates
    const patientHistoryInfo = await rhuPool.query(`
      SELECT 
        p.id, p.patient_id, p.rhu_id, p.last_name, p.first_name, p.middle_name, p.suffix, p.phone, p.gender,
        p.birthdate, p.house_no, p.street, p.barangay, p.city, p.province, p.occupation, p.email, p.philhealth_no, p.guardian,
        MAX(p.age) as age,
        MAX(p.check_date) as check_date,
        MAX(p.height) as height,
        MAX(p.weight) as weight,
        MAX(p.systolic) as systolic,
        MAX(p.diastolic) as diastolic,
        MAX(p.temperature) as temperature,
        MAX(p.heart_rate) as heart_rate,
        MAX(p.respiratory_rate) as respiratory_rate,
        MAX(p.bmi) as bmi,
        MAX(p.comment) as comment,
        STRING_AGG(DISTINCT plr.lab_result, ', ') AS lab_results,
        STRING_AGG(DISTINCT pp.medicine, ', ') AS medicines,
        STRING_AGG(DISTINCT pp.instruction, ', ') AS instruction,
        STRING_AGG(DISTINCT pp.quantity::text, ', ') AS quantity,
        STRING_AGG(DISTINCT ps.category, ', ') AS categories,
        STRING_AGG(DISTINCT ps.service, ', ') AS services
      FROM patient_history p
      LEFT JOIN patient_lab_results plr ON p.id = plr.history_id
      LEFT JOIN patient_prescriptions pp ON p.id = pp.history_id
      LEFT JOIN patient_services ps ON p.id = ps.history_id
      WHERE p.patient_id = $1
      GROUP BY p.id
      ORDER BY p.check_date DESC
      LIMIT 1
    `, [patient_id]);

    const patientHistory = patientHistoryInfo.rows[0] || {};

    // Fetch distinct check dates and group by year
    const getPatientHistoryInfo = await rhuPool.query(`
      SELECT DISTINCT 
        EXTRACT(YEAR FROM check_date) AS year,
        check_date 
      FROM patient_history 
      WHERE patient_id = $1
      ORDER BY check_date DESC
    `, [patient_id]);

    const groupedHistory = getPatientHistoryInfo.rows.reduce((acc, row) => {
      const year = row.year;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(row.check_date);
      return acc;
    }, {});

    res.json({
      patientHistory,
      groupedHistory,
      patientId: patient_id
    });

  } catch (err) {
    console.error("Error: ", err);
    res.status(500).json({ error: "Server error" });
  }
});

// render patient history with the id
router.get("/doctor/patient-history/:patient_id", ensureAuthenticated, checkUserType("Doctor"), async (req, res) => {
  const { patient_id } = req.params;
  console.log("patient history clicked!");

  try {
    const result = await rhuPool.query(`SELECT EXISTS (SELECT 1 FROM patient_history WHERE patient_id = $1) AS exists`, [patient_id]);
    const exists = result.rows[0].exists;

    if (!exists) {
      req.flash('noHistory', 'No History for this patient');
      return res.redirect("/doctor-dashboard");
    }

    res.render("doctor/patient-history", { patient_id });
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).send("Server error");
  }
});

// when date clicked
router.post('/patient-history/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const { date } = req.body;
  try {
    // Fetch the latest patient history and all check dates
    const patientHistoryInfo = await rhuPool.query(`
      SELECT 
        p.id, p.patient_id, p.rhu_id, p.last_name, p.first_name, p.middle_name, p.suffix, p.phone, p.gender,
        p.birthdate, p.house_no, p.street, p.barangay, p.city, p.province, p.occupation, p.email, p.philhealth_no, p.guardian,
        MAX(p.age) as age,
        MAX(p.check_date) as check_date,
        MAX(p.height) as height,
        MAX(p.weight) as weight,
        MAX(p.systolic) as systolic,
        MAX(p.diastolic) as diastolic,
        MAX(p.temperature) as temperature,
        MAX(p.heart_rate) as heart_rate,
        MAX(p.respiratory_rate) as respiratory_rate,
        MAX(p.bmi) as bmi,
        MAX(p.comment) as comment,
        STRING_AGG(DISTINCT plr.lab_result, ', ') AS lab_results,
        STRING_AGG(DISTINCT pp.medicine, ', ') AS medicines,
        STRING_AGG(DISTINCT pp.instruction, ', ') AS instruction,
        STRING_AGG(DISTINCT pp.quantity::text, ', ') AS quantity,
        STRING_AGG(DISTINCT ps.category, ', ') AS categories,
        STRING_AGG(DISTINCT ps.service, ', ') AS services
      FROM patient_history p
      LEFT JOIN patient_lab_results plr ON p.id = plr.history_id
      LEFT JOIN patient_prescriptions pp ON p.id = pp.history_id
      LEFT JOIN patient_services ps ON p.id = ps.history_id
      WHERE p.patient_id = $1 and p.check_date = $2
      GROUP BY p.id
      ORDER BY p.check_date DESC
      LIMIT 1
    `, [patientId, date]);

    const patientHistory = patientHistoryInfo.rows[0] || {};

    // Fetch distinct check dates and group by year
    const getPatientHistoryInfo = await rhuPool.query(`
      SELECT DISTINCT 
        EXTRACT(YEAR FROM check_date) AS year,
        check_date 
      FROM patient_history 
      WHERE patient_id = $1
      ORDER BY check_date DESC
    `, [patientId]);

    const groupedHistory = getPatientHistoryInfo.rows.reduce((acc, row) => {
      const year = row.year;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(row.check_date);
      return acc;
    }, {});

    res.json({
      patientHistory,
      groupedHistory,
      patientId: patientId
    });

  } catch (err) {
    console.error("Error: ", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/doctor/request-laboratory/send", async (req, res) => {
  const { error, value } = patientSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const isPatient = await rhuPool.query(
      `SELECT * FROM doctor_visits WHERE patient_id = $1 AND category IS NULL AND service IS NULL`,
      [value.patient_id]
    );

    if (isPatient.rows.length > 0) {
      await rhuPool.query(
        `UPDATE doctor_visits SET category = $2, service = $3 WHERE patient_id = $1`,
        [value.patient_id, value.category, value.service]
      );
    } else {
      await rhuPool.query(
        `INSERT INTO doctor_visits (patient_id, category, service) VALUES ($1, $2, $3)`,
        [value.patient_id, value.category, value.service]
      );
    }

    return res.redirect("/doctor-dashboard");
  } catch (err) {
    console.error("Error: ", err);
  }
});

router.post("/doctor/diagnose-patient/send", async (req, res) => {
  const { error, value } = patientSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const isPatient = await rhuPool.query(
      `SELECT * FROM doctor_visits WHERE patient_id = $1 AND diagnosis IS NULL`,
      [value.patient_id]
    );

    if (isPatient.rows.length > 0) {
      await rhuPool.query(
        `UPDATE doctor_visits SET diagnosis = $2 WHERE patient_id = $1`,
        [value.patient_id, value.diagnosis]
      );
    } else {
      await rhuPool.query(
        `INSERT INTO doctor_visits (patient_id, diagnosis) VALUES ($1, $2)`,
        [value.patient_id, value.diagnosis]
      );
    }

    return res.redirect("/doctor-dashboard");
  } catch (error) {
    console.error("Error: ", err);
  }
});

router.post("/doctor/findings-patient/send", async (req, res) => {
  const { error, value } = patientSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const isPatient = await rhuPool.query(
      `SELECT * FROM doctor_visits WHERE patient_id = $1 AND findings IS NULL`,
      [value.patient_id]
    );

    if (isPatient.rows.length > 0) {
      await rhuPool.query(
        `UPDATE doctor_visits SET findings = $2 WHERE patient_id = $1`,
        [value.patient_id, value.findings]
      );
    } else {
      await rhuPool.query(
        `INSERT INTO doctor_visits (patient_id, findings) VALUES ($1, $2)`,
        [value.patient_id, value.findings]
      );
    }

    return res.redirect("/doctor-dashboard");
  } catch (error) {
    console.error("Error: ", err);
  }

});

router.get("/doctor-dashboard/prescribe/search", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).send("Query parameter is required");
  }

  try {
    const result = await pharmacyPool.query(
      "SELECT product_name, dosage, product_quantity, product_id, batch_number FROM inventory WHERE product_quantity <> 0 AND product_name ILIKE $1",
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/doctor/prescribe-patient/send", async (req, res) => {
  const { error, value } = patientSchema.validate(req.body);

  console.log(value);

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const rhu_id = req.user.rhu_id;
  let patient_prescription_id;
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const isPatient = await rhuPool.query(
      `SELECT * FROM doctor_visits WHERE patient_id = $1`,
      [value.patient_id]
    );

    if (isPatient.rows.length > 0) {
      await rhuPool.query(
        `UPDATE doctor_visits 
         SET medicine = $2, 
             instruction = $3, 
             quantity = $4
         WHERE patient_id = $1`,
        [value.patient_id, value.medicine, value.instruction, value.quantity]
      );

      const checkPatientPrescription = await rhuPool.query(
        `SELECT patient_prescription_id FROM patient_prescription_data WHERE patient_prescription_id = $1`,
        [value.patient_id]
      );

      if (checkPatientPrescription.rows.length === 0) {
        await rhuPool.query(
          `INSERT INTO patient_prescription_data 
           (patient_prescription_id, patient_id, rhu_id, reciever, relationship_with_patient) 
           VALUES ($1, $2, $3, $4, $5)`,
          [value.patient_id, value.patient_id, rhu_id, value.receiver, value.relationship]
        );

        patient_prescription_id = value.patient_id;
      } else {
        patient_prescription_id = checkPatientPrescription.rows[0].patient_prescription_id;
      }


      await rhuPool.query(
        `INSERT INTO prescription 
         (patient_prescription_id, doctor_name, diagnosis, findings, category, service, product_id, batch_number, medicine, instruction, quantity) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          patient_prescription_id,
          value.doctor,
          isPatient.rows[0].diagnosis,
          isPatient.rows[0].findings,
          isPatient.rows[0].category,
          isPatient.rows[0].service,
          value.product_id,
          value.batch_number,
          value.medicine,
          value.instruction,
          value.quantity
        ]
      );

      req.flash("success", "Submitted Successfully");
    } else {
      req.flash("error", "No patient record.");
    }

    return res.redirect("/doctor-dashboard");
  } catch (error) {
    console.error("Error: ", error);
    req.flash("error", "An error occurred while processing the request.");
    return res.redirect("/doctor-dashboard");
  }
});

router.delete("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

async function fetchPatientList(page, limit) {
  const offset = (page - 1) * limit;

  try {
    // First, get the total count of unique patients
    const totalItemsResult = await rhuPool.query(`
      SELECT COUNT(DISTINCT p.patient_id) as count
      FROM patients p
      LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
      LEFT JOIN doctor_visits dv ON p.patient_id = dv.patient_id
      LEFT JOIN medtech_labs lr ON p.patient_id = lr.patient_id
      LEFT JOIN prescription pr ON p.patient_id = pr.patient_prescription_id
      LEFT JOIN rhu r ON p.rhu_id = r.rhu_id;
    `);

    const totalItems = parseInt(totalItemsResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    // Now, fetch the patient list with aggregation including prescription data
    const getPatientList = await rhuPool.query(`
      SELECT 
        p.patient_id, p.rhu_id, p.last_name, p.first_name, p.middle_name, p.suffix, p.phone, p.gender,
        p.birthdate, p.house_no, p.street, p.barangay, p.city, p.province, p.occupation, p.email, p.philhealth_no, p.guardian,
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
        MAX(dv.follow_date) AS follow_date,
        COALESCE(MAX(dv.diagnosis), '') AS diagnosis,
        COALESCE(MAX(dv.findings), '') AS findings,
        STRING_AGG(DISTINCT dv.category, ', ') AS categories,
        STRING_AGG(DISTINCT dv.service, ', ') AS services,
        STRING_AGG(DISTINCT dv.medicine, ', ') AS medicines,
        STRING_AGG(DISTINCT dv.instruction, ', ') AS instructions,
        STRING_AGG(DISTINCT dv.quantity::text, ', ') AS quantities,
        STRING_AGG(DISTINCT lr.lab_result, ', ') AS lab_results,
        STRING_AGG(DISTINCT pr.medicine, ', ') AS prescription_medicines,
        r.rhu_name, r.rhu_address
      FROM patients p
      LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
      LEFT JOIN doctor_visits dv ON p.patient_id = dv.patient_id
      LEFT JOIN medtech_labs lr ON p.patient_id = lr.patient_id
      LEFT JOIN prescription pr ON p.patient_id = pr.patient_prescription_id
      LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
      GROUP BY p.patient_id, r.rhu_name, r.rhu_address
      ORDER BY p.first_name
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const data = formatPatientData(getPatientList.rows);
    return { getPatientList: data, totalPages };
  } catch (err) {
    console.error("Error: ", err.message, err.stack);
    throw new Error("Error fetching patients list");
  }
}

function formatPatientData(rows) {
  return rows.map((row) => ({
    ...row,
    middle_name: row.middle_name ? row.middle_name : "",
    check_date: formatDate(row.check_date),
    birthdate: formatDate(row.birthdate),
    follow_date: formatDate(row.follow_date)
  }));
}

module.exports = router;
