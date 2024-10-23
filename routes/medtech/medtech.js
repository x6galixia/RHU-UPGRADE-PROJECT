const express = require("express");
const router = express.Router();
const rhuPool = require("../../models/rhudb");
const { calculateAge, formatDate } = require("../../public/js/global/functions");

router.get("/medtech-dashboard", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isAjax = req.query.ajax === "true";

  try {
    const { getPatientList, totalPages } = await fetchPatientList(page, limit);

    if (isAjax) {
      return res.json({
        getPatientList,
        currentPage: page,
        totalPages,
        limit,
      });
    }

    res.render("medtech/medtech-dashboard", {
      getPatientList,
      currentPage: page,
      totalPages,
      limit,
    });
  } catch (err) {
    console.error("Error: ", err.message, err.stack);
    res.status(500).send("Internal server error");
  }
});

router.get("/medtech-dashboard/search", async (req, res) => {
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
      STRING_AGG(DISTINCT dv.category, ', ') AS categories,  -- Modified to aggregate categories
      STRING_AGG(DISTINCT dv.service, ', ') AS services,    -- Modified to aggregate services
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