const express = require("express");
const router = express.Router();
const rhuPool = require("../../models/rhudb");
const Joi = require("joi");
const { setUserData, ensureAuthenticated, checkUserType } = require("../../middlewares/middleware");
const methodOverride = require("method-override");
const { calculateAge, formatDate } = require("../../public/js/global/functions");

const multer = require("multer");
const fs = require('fs');
const path = require('path');

router.use(setUserData);
router.use(methodOverride("_method"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/lab-results/';

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
router.use("/uploads/lab-results", express.static("uploads"));

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
  follow_date: Joi.date().allow("").optional(),
  diagnosis: Joi.string().allow("").optional(),
  findings: Joi.string().allow("").optional(),
  category: Joi.string().allow("").optional(),
  service: Joi.string().allow("").optional(),
  medicine: Joi.string().allow("").optional(),
  instruction: Joi.string().allow("").optional(),
  quantity: Joi.string().allow("").optional(),
  //medtech
  lab_result: Joi.allow("").optional(),
});

router.get("/medtech-dashboard", ensureAuthenticated, checkUserType("Med Tech"), async (req, res) => {
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

    res.render("medtech/medtech-dashboard", {
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

router.get("/medtech-dashboard/search", ensureAuthenticated, checkUserType("Med Tech"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { query } = req.query;

  try {
    let searchResult;
    const baseQuery = getBasePatientQuery();

    if (!query) {
      // Fetch all patients if no search query is provided
      searchResult = await rhuPool.query(
        `${baseQuery} 
        GROUP BY p.patient_id, r.rhu_name, r.rhu_address 
        ORDER BY p.first_name 
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    } else {
      // Apply search query with filtering
      searchResult = await rhuPool.query(
        `${baseQuery} 
        AND (
          CONCAT(p.first_name, ' ', p.middle_name, ' ', p.last_name, ' ', p.suffix) ILIKE $1
          OR CONCAT(p.house_no, ' ', p.street, ' ', p.barangay, ' ', p.city, ' ', p.province) ILIKE $1
          OR CONCAT(p.first_name, ' ', p.last_name, ' ', p.suffix) ILIKE $1
          OR p.first_name ILIKE $1
          OR p.middle_name ILIKE $1
          OR p.last_name ILIKE $1
          OR p.suffix ILIKE $1
          OR r.rhu_name ILIKE $1
        )
        GROUP BY p.patient_id, r.rhu_name, r.rhu_address 
        ORDER BY p.first_name 
        LIMIT $2 OFFSET $3`,
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

router.post("/medtech-dashboard/send-patient-lab", upload.array('lab_result', 6), ensureAuthenticated, checkUserType("Med Tech"), async (req, res) => {
  const { error, value } = patientSchema.validate(req.body);
  const medtech_id = req.user.id;

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const files = req.files;
    const patientId = value.patient_id;
    console.log("Patient ID:", patientId);


    if (files && files.length > 0) {
      for (let file of files) {
        const filename = path.basename(file.path);

        await rhuPool.query(`
          INSERT INTO medtech_labs (patient_id, lab_result, medtech_id) 
          VALUES ($1, $2, $3)`,
          [patientId, filename, medtech_id]
        );
      }
    }

    req.flash("success", "Submitted Successfully");
    res.redirect("/medtech-dashboard");
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).send("An error occurred while uploading files.");
  }
});

router.get("/medtech-dashboard/recently-added", ensureAuthenticated, checkUserType("Med Tech"), async (req, res) => {
  console.log("route accessed");
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const isAjax = req.query.ajax === "true";
  const rhuId = req.query.rhu_id;

  try {
    const { getPatientList, totalPages } = await fetchPatientListForRecentlyAdded(
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

router.post('/medtech-dashboard/update-patient-lab', upload.array('lab_result'), async (req, res) => {
  const { deletedImages } = req.body;
  const addedImages = req.files; // This will be an array of uploaded files

  console.log("Deleted Images: ", deletedImages);
  console.log("Added Images: ", addedImages);

  try {
    // Handle deletions
    if (deletedImages && deletedImages.length > 0) {
      for (const image of deletedImages) {
        // Delete from database
        const deleteQuery = `DELETE FROM medtech_labs WHERE lab_result = $1`;
        await rhuPool.query(deleteQuery, [image]);

        // Delete file from server
        const filePath = path.join(__dirname, '../../uploads/lab-results', image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      req.flash("success", "Deleted Successfully");
    }

    // Handle updates (new images)
    if (addedImages && addedImages.length > 0) {
      for (const file of addedImages) {
        const oldImage = file.originalname; // Get the original filename
        const newFilename = file.filename; // Get the new filename assigned by multer

        // Update the database
        const updateQuery = `UPDATE medtech_labs SET lab_result = $1 WHERE lab_result = $2`;
        await rhuPool.query(updateQuery, [newFilename, oldImage]);

        // Remove the old image file if it exists
        const oldFilePath = path.join(__dirname, '../../uploads/lab-results', oldImage);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      req.flash("success", "Updated Successfully");
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
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

async function fetchPatientList(page, limit) {
  const offset = (page - 1) * limit;

  try {
    // Get total items count
    const totalItemsResult = await rhuPool.query(`
      SELECT COUNT(DISTINCT p.patient_id) as count
      FROM patients p
      LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
      LEFT JOIN doctor_visits dv ON p.patient_id = dv.patient_id
      LEFT JOIN medtech_labs lr ON p.patient_id = lr.patient_id
      LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
      WHERE dv.category IS NOT NULL 
        AND dv.service IS NOT NULL
        AND lr.lab_result IS NULL;
    `);

    const totalItems = parseInt(totalItemsResult.rows[0].count, 10);
    const totalPages = calculateTotalPages(totalItems, limit);

    // Fetch patients
    const getPatientList = await rhuPool.query(
      `${getBasePatientQuery()} 
      GROUP BY p.patient_id, r.rhu_name, r.rhu_address
      ORDER BY p.first_name 
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const data = formatPatientData(getPatientList.rows);
    return { getPatientList: data, totalPages };
  } catch (err) {
    console.error("Error: ", err.message, err.stack);
    throw new Error("Error fetching patients list");
  }
}

async function fetchPatientListForRecentlyAdded(page, limit, rhuId) {
  const offset = (page - 1) * limit;

  try {
    let query;
    let queryParams = [limit, offset];
    let countQuery;

    if (rhuId) {
      query = `
        SELECT
          ml.patient_id,
          ml.medtech_id,
          p.rhu_id,
          p.last_name,
          p.first_name,
          p.middle_name,
          p.suffix,
          r.rhu_name,
          CONCAT(u.firstname, ' ', u.surname) AS medtech_name,
          STRING_AGG(DISTINCT ml.lab_result, ', ') AS lab_results,
          STRING_AGG(DISTINCT dv.category, ', ') AS categories,
          STRING_AGG(DISTINCT dv.service, ', ') AS services
        FROM medtech_labs ml
        LEFT JOIN patients p ON ml.patient_id = p.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        LEFT JOIN users u ON ml.medtech_id = u.id
        LEFT JOIN doctor_visits dv ON ml.patient_id = dv.patient_id
        WHERE r.rhu_id = $3
        GROUP BY ml.patient_id, ml.medtech_id, p.rhu_id, p.last_name, p.first_name, p.middle_name, p.suffix, r.rhu_name, u.firstname, u.surname
        ORDER BY p.first_name
        LIMIT $1 OFFSET $2
      `;
      queryParams.push(rhuId);

      countQuery = `
        SELECT COUNT(DISTINCT ml.patient_id) AS total
        FROM medtech_labs ml
        LEFT JOIN patients p ON ml.patient_id = p.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        LEFT JOIN users u ON ml.medtech_id = u.id
        LEFT JOIN doctor_visits dv ON ml.patient_id = dv.patient_id
        WHERE r.rhu_id = $1
      `;
    } else {
      query = `
        SELECT
          ml.patient_id,
          ml.medtech_id,
          p.rhu_id,
          p.last_name,
          p.first_name,
          p.middle_name,
          p.suffix,
          r.rhu_name,
          CONCAT(u.firstname, ' ', u.surname) AS medtech_name,
          STRING_AGG(DISTINCT ml.lab_result, ', ') AS lab_results,
          STRING_AGG(DISTINCT dv.category, ', ') AS categories,
          STRING_AGG(DISTINCT dv.service, ', ') AS services
        FROM medtech_labs ml
        LEFT JOIN patients p ON ml.patient_id = p.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        LEFT JOIN users u ON ml.medtech_id = u.id
        LEFT JOIN doctor_visits dv ON ml.patient_id = dv.patient_id
        GROUP BY ml.patient_id, ml.medtech_id, p.rhu_id, p.last_name, p.first_name, p.middle_name, p.suffix, r.rhu_name, u.firstname, u.surname
        ORDER BY p.first_name
        LIMIT $1 OFFSET $2
      `;

      countQuery = `
        SELECT COUNT(DISTINCT ml.patient_id) AS total
        FROM medtech_labs ml
        LEFT JOIN patients p ON ml.patient_id = p.patient_id
        LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
        LEFT JOIN users u ON ml.medtech_id = u.id
        LEFT JOIN doctor_visits dv ON ml.patient_id = dv.patient_id
      `;
    }

    const patientListResult = await rhuPool.query(query, queryParams);
    const countResult = await rhuPool.query(countQuery, rhuId ? [rhuId] : []);

    const formattedPatientList = patientListResult.rows.map(patient => ({
      ...patient,
      medtech_name: patient.medtech_name || 'N/A',
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

function getBasePatientQuery() {
  return `
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
      MAX(dv.diagnosis) AS diagnosis,
      MAX(dv.findings) AS findings,
      STRING_AGG(DISTINCT dv.category, ', ') AS categories,
      STRING_AGG(DISTINCT dv.service, ', ') AS services,
      MAX(dv.medicine) AS medicine,
      MAX(dv.instruction) AS instruction,
      MAX(dv.quantity) AS quantity,
      MAX(lr.lab_result) AS lab_result,
      r.rhu_name, r.rhu_address
    FROM patients p
    LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
    LEFT JOIN doctor_visits dv ON p.patient_id = dv.patient_id
    LEFT JOIN medtech_labs lr ON p.patient_id = lr.patient_id
    LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
    WHERE dv.category IS NOT NULL 
      AND dv.service IS NOT NULL
      AND lr.lab_result IS NULL
  `;
}

function formatPatientData(rows) {
  return rows.map((row) => ({
    ...row,
    middle_name: row.middle_name ? row.middle_name : "",
    suffix: row.suffix ? row.suffix : "",
    phone: row.phone ? row.phone : "",
    check_date: formatDate(row.check_date),
    birthdate: formatDate(row.birthdate),
    follow_date: formatDate(row.follow_date),
  }));
}

function calculateTotalPages(totalItems, limit) {
  return totalItems > 0 ? Math.ceil(totalItems / limit) : 1;
}

module.exports = router;