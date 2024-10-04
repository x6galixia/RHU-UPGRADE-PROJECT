const express = require("express");
const router = express.Router();
const rhuPool = require("../../models/rhudb");
const { calculateAge, formatDate } = require("../../public/js/global/functions");

router.get("/doctor-dashboard", async (req, res) => {
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
        limit
      });
    }

    res.render("doctor/doctor-dashboard", {
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

router.get("/doctor-dashboard/search", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { query } = req.query;

  try {
    let searchResult;

    if (!query) {
      searchResult = await rhuPool.query(
        `SELECT * FROM patients ORDER BY first_name LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    } else {
      searchResult = await rhuPool.query(
        `SELECT * FROM patients
         WHERE CONCAT(first_name, ' ', middle_name, ' ', last_name, ' ', suffix) ILIKE $1
         OR CONCAT(first_name, ' ', last_name, ' ', suffix) ILIKE $1
         OR first_name ILIKE $1
         OR middle_name ILIKE $1
         OR last_name ILIKE $1
         OR suffix ILIKE $1
         LIMIT $2 OFFSET $3`,
        [`%${query}%`, limit, offset]
      );
    }

    const data = formatPatientData(searchResult.rows);

    res.json({ getPatientList: data });
  } catch (err) {
    console.error("Error: ", err.message, err.stack);
    res.status(500).send("An error occurred during the search.");
  }
});

router.get("/doctor/patient-history", (req, res) => {
  res.render("doctor/patient-history");
});

async function fetchPatientList(page, limit) {
  const offset = (page - 1) * limit;
  try {
    const totalItemsResult = await rhuPool.query(`
      SELECT COUNT(*) as count
      FROM patients p
      LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
      LEFT JOIN doctor_visits dv ON p.patient_id = dv.patient_id
      LEFT JOIN medtech_labs lr ON p.patient_id = lr.patient_id
      LEFT JOIN rhu r ON p.rhu_id = r.rhu_id;
    `);
    const totalItems = parseInt(totalItemsResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    const getPatientList = await rhuPool.query(`
      SELECT
        p.patient_id, p.rhu_id, p.last_name, p.first_name, p.middle_name, p.suffix, p.phone, p.gender,
        p.birthdate, p.house_no, p.street, p.barangay, p.town, p.province, p.occupation, p.email, p.philhealth_no, p.guardian,
        nc.check_date, nc.height, nc.weight, nc.systolic, nc.diastolic, nc.temperature, nc.heart_rate, nc.respiratory_rate, nc.bmi, nc.comment,
        dv.follow_date, dv.diagnoses, dv.findings, dv.category, dv.service, dv.medicine, dv.instruction, dv.quantity,
        lr.lab_result, r.rhu_name, r.rhu_address
      FROM patients p
      LEFT JOIN nurse_checks nc ON p.patient_id = nc.patient_id
      LEFT JOIN doctor_visits dv ON p.patient_id = dv.patient_id
      LEFT JOIN medtech_labs lr ON p.patient_id = lr.patient_id
      LEFT JOIN rhu r ON p.rhu_id = r.rhu_id
      ORDER BY p.first_name LIMIT $1 OFFSET $2`, [limit, offset]
    );

    const data = formatPatientData(getPatientList.rows);

    return { getPatientList: data, totalPages };
  } catch (err) {
    console.error("Error: ", err.message, err.stack);
    throw new Error("Error fetching patients list");
  }
}

function formatPatientData(rows) {
  return rows.map(row => ({
    ...row,
    middle_name: row.middle_name ? row.middle_name : '',
    check_date: formatDate(row.check_date),
    birthdate: formatDate(row.birthdate),
    follow_date: formatDate(row.follow_date),
    age: calculateAge(row.birthdate),
  }));
}

module.exports = router;