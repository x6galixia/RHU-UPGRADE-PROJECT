const express = require("express");
const Joi = require('joi');
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const router = express.Router();

const pharmacyPool = require("../../models/pharmacydb");
const { calculateAge, formatDate } = require("../../public/js/global/functions");
const { setUserData, ensureAuthenticated, checkUserType } = require("../../middlewares/middleware");
const methodOverride = require("method-override");
const rhuPool = require("../../models/rhudb");

router.use(setUserData);
router.use(methodOverride("_method"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/beneficiary-img/';

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

const medicineSchema = Joi.object({
  product_id: Joi.string().required(),
  rhu_id: Joi.number().integer(),
  product_code: Joi.string().optional(),
  product_name: Joi.string().optional(),
  brand_name: Joi.string().optional(),
  supplier: Joi.string().optional(),
  product_quantity: Joi.number().integer().min(1).optional(),
  dosage_form: Joi.string().optional(),
  dosage: Joi.string().optional(),
  reorder_level: Joi.number().integer().min(0).optional(),
  batch_number: Joi.string().optional(),
  expiration: Joi.date().optional(),
  date_added: Joi.date().optional(),
  price: Joi.number().integer(),
  therapeutic_category: Joi.string().optional()
});

const beneficiarySchema = Joi.object({
  beneficiary_id: Joi.number().integer().optional(),
  last_name: Joi.string().required(),
  first_name: Joi.string().required(),
  middle_name: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  gender: Joi.string().required(),
  birthdate: Joi.date().required(),
  age: Joi.string().allow('').optional(),
  street: Joi.string().allow('').optional(),
  barangay: Joi.string().required(),
  city: Joi.string().required(),
  province: Joi.string().required(),
  occupation: Joi.string().allow('').optional(),
  senior_citizen: Joi.string().optional(),
  pwd: Joi.string().optional(),
  picture: Joi.string().allow('').optional(),
  note: Joi.string().allow('').optional(),
  processed_date: Joi.date().required(),
  existing_picture: Joi.string().allow('').optional()
});

const dispenseSchema = Joi.object({
  patient_prescription_id: Joi.string().required(),
  beneficiary_id: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
  transaction_number: Joi.string().required(),
  date_issued: Joi.date().required(),
  beneficiary_name: Joi.string().required(),
  diagnosis: Joi.string().required(),
  findings: Joi.string().required(),
  doctor: Joi.string().required(),
  receiver: Joi.string().required(),
  relationship_beneficiary: Joi.string().required(),
  medicines: Joi.array().items(Joi.object({
    product_id: Joi.string().required(),
    batch_number: Joi.string().required(),
    product_details: Joi.string().required(),
    quantity: Joi.number().integer().greater(0).required()
  })).required()
});

const upload = multer({ storage: storage });
router.use("/uploads/beneficiary-img", express.static("uploads"));

router.get("/pharmacy-inventory", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isAjax = req.query.ajax === "true";

  try {
    const { getInventoryList, totalPages } = await fetchInventoryList(page, limit, req.user.rhu_id);
    const { quantityNotif } = await getQuantityNotification(req.user.rhu_id);

    if (isAjax) {
      return res.json({
        getInventoryList,
        user: req.user,
        currentPage: page,
        totalPages,
        limit,
        quantityNotif
      });
    }

    res.render("pharmacy/inventory", {
      getInventoryList,
      user: req.user,
      currentPage: page,
      totalPages,
      limit,
      quantityNotif
    });
  } catch (err) {
    console.error("Error: ", err);
    res.sendStatus(500);
  }
});

router.get("/pharmacy-inventory/search", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { query } = req.query;

  try {
    let searchResult;

    if (!query) {
      searchResult = await pharmacyPool.query(
        `SELECT * FROM inventory WHERE rhu_id = $3 ORDER BY product_name LIMIT $1 OFFSET $2`, [limit, offset, req.user.rhu_id]
      );
    } else {
      searchResult = await pharmacyPool.query(
        `SELECT * FROM inventory 
         WHERE rhu_id = $2 
         AND (CONCAT(product_name, ' ', brand_name) ILIKE $1
         OR product_name ILIKE $1
         OR brand_name ILIKE $1)
         LIMIT 10`,
        [`%${query}%`, req.user.rhu_id]
      );
    }

    const data = searchResult.rows.map(row => ({
      ...row,
      expiration: formatDate(row.expiration)
    }));

    res.json({ getInventoryList: data });
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).send("An error occurred during the search.");
  }
});

router.get("/pharmacy-records", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isAjax = req.query.ajax === "true";

  try {
    const { getBeneficiaryList, totalPages } = await fetchBeneficiaryList(page, limit);

    if (isAjax) {
      return res.json({
        getBeneficiaryList,
        user: req.user,
        currentPage: page,
        totalPages,
        limit
      });
    }

    res.render("pharmacy/beneficiary-records", {
      getBeneficiaryList,
      user: req.user,
      currentPage: page,
      totalPages,
      limit
    });
  } catch (err) {
    console.error("Error: ", err);
    res.sendStatus(500);
  }
});

router.get("/pharmacy-records/search", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { query } = req.query;

  try {
    let searchResult;

    if (!query) {
      searchResult = await pharmacyPool.query(
        `WITH medicine_agg AS (
           SELECT tm.tran_id,
                  json_agg(
                    json_build_object(
                      'product_id', tm.product_id,
                      'batch_number', tm.batch_number,
                      'product_details', tm.product_details,
                      'quantity', tm.quantity
                    )
                  ) AS medicines
           FROM transaction_medicine tm
           GROUP BY tm.tran_id
         )
         SELECT b.*, 
                COALESCE(json_agg(
                  json_build_object(
                    'id', t.id,
                    'transaction_number', t.transaction_number,
                    'date_issued', t.date_issued,
                    'doctor', t.doctor,
                    'reciever', t.reciever,
                    'relationship_beneficiary', t.relationship_beneficiary,
                    'medicines', COALESCE(m.medicines, '[]')
                  )
                ) FILTER (WHERE t.id IS NOT NULL), '[]') AS transaction_records
         FROM beneficiary b
         LEFT JOIN transaction_records t ON b.beneficiary_id = t.beneficiary_id
         LEFT JOIN medicine_agg m ON t.id = m.tran_id
         GROUP BY b.beneficiary_id
         ORDER BY b.first_name
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    } else {
      searchResult = await pharmacyPool.query(
        `WITH medicine_agg AS (
           SELECT tm.tran_id,
                  json_agg(
                    json_build_object(
                      'product_id', tm.product_id,
                      'batch_number', tm.batch_number,
                      'product_details', tm.product_details,
                      'quantity', tm.quantity
                    )
                  ) AS medicines
           FROM transaction_medicine tm
           GROUP BY tm.tran_id
         )
         SELECT b.*, 
                COALESCE(json_agg(
                  json_build_object(
                    'id', t.id,
                    'transaction_number', t.transaction_number,
                    'date_issued', t.date_issued,
                    'doctor', t.doctor,
                    'reciever', t.reciever,
                    'relationship_beneficiary', t.relationship_beneficiary,
                    'medicines', COALESCE(m.medicines, '[]')
                  )
                ) FILTER (WHERE t.id IS NOT NULL), '[]') AS transaction_records
         FROM beneficiary b
         LEFT JOIN transaction_records t ON b.beneficiary_id = t.beneficiary_id
         LEFT JOIN medicine_agg m ON t.id = m.tran_id
         WHERE CONCAT(b.first_name, ' ', b.middle_name, ' ', b.last_name) ILIKE $1
            OR CONCAT(b.first_name, ' ', b.last_name) ILIKE $1
            OR b.first_name ILIKE $1
            OR b.middle_name ILIKE $1
            OR b.last_name ILIKE $1
         GROUP BY b.beneficiary_id
         LIMIT 10`,
        [`%${query}%`]
      );
    }

    const data = searchResult.rows.map(row => ({
      ...row,
      middle_name: row.middle_name ? row.middle_name : '',
      age: calculateAge(row.birthdate),
      senior_citizen: isSeniorCitizen(row.age),
      transaction_records: row.transaction_records ? row.transaction_records : []
    }));

    res.json({ getBeneficiaryList: data });
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).send("An error occurred during the search.");
  }
});

router.get("/pharmacy-dispense-request", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isAjax = req.query.ajax === "true";
  const rhu_id = req.user.rhu_id;

  try {
    const { getDispenseList, totalPages } = await fetchDispenseList(page, limit, rhu_id);

    if (isAjax) {
      return res.json({
        getDispenseList,
        user: req.user,
        currentPage: page,
        totalPages,
        limit
      });
    }

    res.render("pharmacy/requests-for-dispense", {
      getDispenseList,
      user: req.user,
      currentPage: page,
      totalPages,
      limit
    });
  } catch (err) {
    console.error("Error: ", err);
    res.sendStatus(500);
  }
});

router.get("/pharmacy-dispense/search", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { query } = req.query;

  try {
    let searchResult;

    if (!query) {
      // Fetch all data without search filter
      searchResult = await rhuPool.query(
        `SELECT pd.*, 
                pt.*, 
                COALESCE(json_agg(p) FILTER (WHERE p.id IS NOT NULL), '[]') AS prescription 
         FROM patient_prescription_data pd
         LEFT JOIN prescription p ON pd.patient_prescription_id = p.patient_prescription_id
         LEFT JOIN patients pt ON pd.patient_id = pt.patient_id
         GROUP BY pd.patient_prescription_id, pt.patient_id
         ORDER BY pt.first_name
         LIMIT $1 OFFSET $2`, [limit, offset]
      );
    } else {
      // Fetch data with search filter
      searchResult = await rhuPool.query(
        `SELECT pd.*, 
                pt.*, 
                COALESCE(json_agg(p) FILTER (WHERE p.id IS NOT NULL), '[]') AS prescription 
         FROM patient_prescription_data pd
         LEFT JOIN prescription p ON pd.patient_prescription_id = p.patient_prescription_id
         LEFT JOIN patients pt ON pd.patient_id = pt.patient_id
         WHERE CONCAT(pt.first_name, ' ', pt.middle_name, ' ', pt.last_name) ILIKE $1
            OR CONCAT(pt.first_name, ' ', pt.last_name) ILIKE $1
            OR pt.first_name ILIKE $1
            OR pt.middle_name ILIKE $1
            OR pt.last_name ILIKE $1
         GROUP BY pd.patient_prescription_id, pt.patient_id
         ORDER BY pt.first_name
         LIMIT $2 OFFSET $3`,
        [`%${query}%`, limit, offset]
      );
    }

    // Format data for response
    const data = searchResult.rows.map(row => ({
      ...row,
      middle_name: row.middle_name || '',
      age: calculateAge(row.birthdate),
      senior_citizen: isSeniorCitizen(row.age)
    }));

    res.json({ getDispenseList: data });
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).send("An error occurred during the search.");
  }
});

router.get("/pharmacy-dispense/:patientPrescriptionId", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const { patientPrescriptionId } = req.params;

  try {
    const dispenseDetails = await rhuPool.query(
      `SELECT pd.*, pt.*, 
              COALESCE(json_agg(p) FILTER (WHERE p.id IS NOT NULL), '[]') AS prescription 
       FROM patient_prescription_data pd
       LEFT JOIN prescription p ON pd.patient_prescription_id = p.patient_prescription_id
       LEFT JOIN patients pt ON pd.patient_id = pt.patient_id
       WHERE pd.patient_prescription_id = $1
       GROUP BY pd.patient_prescription_id, pt.patient_id`, [patientPrescriptionId]
    );

    res.json(dispenseDetails.rows[0]);
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).json({ error: "Error fetching dispense details" });
  }
});

router.get("/pharmacy-records/beneficiary-index-form/:beneficiaryId", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const { beneficiaryId } = req.params;
  try {
    const transactionRecords = await pharmacyPool.query(`
      SELECT 
        tr.transaction_number,
        tm.product_details,
        tm.quantity,
        tm.batch_number,
        tr.date_issued,
        tr.doctor,
        tr.reciever,
        tr.relationship_beneficiary
      FROM 
        transaction_records tr
      JOIN 
        transaction_medicine tm
      ON 
        tr.id = tm.tran_id
      WHERE 
        tr.beneficiary_id = $1;
    `, [beneficiaryId]);

    res.json(transactionRecords.rows);
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).json({ error: "Error fetching Transaction records" });
  }
});

router.get("/pharmacy-records/beneficiary/:id", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const beneficiaryId = parseInt(req.params.id);

  if (isNaN(beneficiaryId)) {
    return res.status(400).json({ message: "Invalid beneficiary ID" });
  }

  try {
    const result = await pharmacyPool.query(
      `SELECT beneficiary_id, last_name, first_name, middle_name, gender, birthdate, processed_date, 
              phone, occupation, senior_citizen, pwd, street, barangay, city, province, note, picture 
       FROM beneficiary 
       WHERE beneficiary_id = $1`,
      [beneficiaryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Beneficiary not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching beneficiary:", err);
    res.status(500).json({ message: "Failed to fetch the beneficiary." });
  }
});

router.get("/pharmacy-index-form", ensureAuthenticated, checkUserType("Pharmacist"), (req, res) => {
  res.render("pharmacy/beneficiary-index-form",
    { user: req.user });
});

router.get("/pharmacy-request", ensureAuthenticated, checkUserType("Pharmacist"), (req, res) => {
  res.render("pharmacy/pharmacy-request",
    { user: req.user });
});

router.get("/pharmacy-trends", ensureAuthenticated, checkUserType("Pharmacist"), (req, res) => {
  res.render("pharmacy/trends",
    { user: req.user });
});

router.get("/pharmacy/generate-transaction-id/new-id", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  try {
    const result = await pharmacyPool.query(
      "SELECT transaction_number FROM transaction_records ORDER BY transaction_number DESC LIMIT 1"
    );

    let lastId = "T0000";
    if (result.rows.length > 0 && result.rows[0].transaction_number) {
      lastId = result.rows[0].transaction_number;
    }

    const newId = generateNextTransactionId(lastId);
    res.json({ id: newId });
  } catch (err) {
    console.error("Error generating ID:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.get("/pharmacy/trends/growth/monthly", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  try {
    const growthMonthly = await pharmacyPool.query(`
        SELECT 
            EXTRACT(YEAR FROM tr.date_issued) AS year,
            EXTRACT(MONTH FROM tr.date_issued) AS month,
            SUM(tm.quantity) AS total_quantity,
            COUNT(DISTINCT tr.transaction_number) AS total_transactions
        FROM 
            transaction_medicine tm
        JOIN 
            transaction_records tr ON tm.tran_id = tr.id
        GROUP BY 
            year, month
        ORDER BY 
            year, month;
    `);

    return res.json(growthMonthly.rows);
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "An error occurred while fetching monthly growth trends" });
  }
});

router.get("/pharmacy/trends/growth/yearly", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  try {
    const growthYearly = await pharmacyPool.query(`
        SELECT 
            EXTRACT(YEAR FROM tr.date_issued) AS year,
            SUM(tm.quantity) AS total_quantity,
            COUNT(DISTINCT tr.transaction_number) AS total_transactions
        FROM 
            transaction_medicine tm
        JOIN 
            transaction_records tr ON tm.tran_id = tr.id
        GROUP BY 
            year
        ORDER BY 
            year;
    `);

    return res.json(growthYearly.rows);
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "An error occurred while fetching yearly growth trends" });
  }
});

router.get("/pharmacy/trends/age-demographics", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  try {
    const ageDemographics = await pharmacyPool.query(`
      SELECT 
          CASE
              WHEN age BETWEEN 0 AND 14 THEN '0-14'
              WHEN age BETWEEN 15 AND 64 THEN '15-64'
              WHEN age >= 65 THEN '65 and above'
          END AS age_group,
          COUNT(*) AS beneficiary_count
      FROM 
          beneficiary
      GROUP BY 
          age_group
      ORDER BY 
          age_group;
    `);

    return res.json(ageDemographics.rows);
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "An error occurred while fetching age demographics trends" });
  }
});

router.get("/pharmacy/trends/most-prescribe-drugs", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  try {
    const mostPrescribe = await pharmacyPool.query(`
        SELECT 
            i.therapeutic_category,
            COUNT(DISTINCT tr.beneficiary_id) AS total_beneficiaries
        FROM 
            transaction_medicine tm
        JOIN 
            transaction_records tr ON tm.tran_id = tr.id
        JOIN 
            inventory i ON tm.product_id = i.product_id
        GROUP BY 
            i.therapeutic_category
        ORDER BY 
            total_beneficiaries DESC
        LIMIT 10;
    `);

    return res.json(mostPrescribe.rows);
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "An error occurred while fetching most prescribe drugs trends" });
  }
});

router.get("/pharmacy/trends/diagnosis/top", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  try {
    const topDiagnoses = await pharmacyPool.query(`
      SELECT 
          diagnosis,
          COUNT(*) AS diagnosis_count
      FROM 
          transaction_records
      WHERE 
          diagnosis IS NOT NULL AND diagnosis <> ''
      GROUP BY 
          diagnosis
      ORDER BY 
          diagnosis_count DESC
      LIMIT 10;
    `);

    return res.json(topDiagnoses.rows);
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "An error occurred while fetching the top diagnoses" });
  }
});

router.get("/pharmacy/trends/number-of-beneficiaries", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  try {
    const numberOfBeneficiaries = await pharmacyPool.query(`
      SELECT COUNT(*) AS total_beneficiaries
        FROM beneficiary;
    `);

    return res.json(numberOfBeneficiaries.rows);
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "An error occurred while fetching most prescribe drugs trends" });
  }
});

router.post("/pharmacy-inventory/add-medicine", async (req, res) => {
  const { error, value } = medicineSchema.validate(req.body);
  const rhu_id = req.user.rhu_id;

  console.log(value, rhu_id);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    await pharmacyPool.query(`
      INSERT INTO inventory (product_id, product_code, product_name, brand_name, supplier, product_quantity, dosage_form, dosage, reorder_level, batch_number, expiration, date_added, rhu_id, price, therapeutic_category)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [value.product_id, value.product_code, value.product_name, value.brand_name, value.supplier, value.product_quantity, value.dosage_form, value.dosage, value.reorder_level, value.batch_number, value.expiration, value.date_added, rhu_id, value.price, value.therapeutic_category]
    );
    req.flash("success", "Medicine Added Successfully");
    res.redirect("/pharmacy-inventory");
  } catch (err) {
    req.flash("error", err);
    return res.redirect("/pharmacy-inventory");
  }
});

router.post("/pharmacy-inventory/restock-medicine", async (req, res) => {
  const { error, value } = medicineSchema.validate(req.body);

  const rhu_id = req.user.rhu_id;

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    const result = await pharmacyPool.query(
      "SELECT product_quantity FROM inventory WHERE product_id = $1 AND product_code = $2 AND rhu_id = $3",
      [value.product_id, value.product_code, rhu_id]
    );

    if (result.rows.length === 0) {
      req.flash("error", "Medicine not found");
      return res.redirect("/pharmacy-inventory");
    }

    const existingQuantity = result.rows[0].product_quantity;

    const newQuantity = existingQuantity + value.product_quantity;

    await pharmacyPool.query(
      "UPDATE inventory SET batch_number = $4, date_added = $5, expiration = $6, product_quantity = $7, price = $8, therapeutic_category = $9 WHERE product_id = $1 AND product_code = $2 AND rhu_id = $3",
      [value.product_id, value.product_code, rhu_id, value.batch_number, value.date_added, value.expiration, newQuantity, value.price, value.therapeutic_category]
    );
    req.flash("success", "Restock Medicine Successful");
    return res.redirect("/pharmacy-inventory");
  } catch (err) {
    req.flash("error", err);
    return res.redirect("/pharmacy-inventory");
  }
});

router.post("/pharmacy-inventory/transfer-medicine", async (req, res) => {
  const { error, value } = medicineSchema.validate(req.body);

  const rhu_id = req.user.rhu_id;

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    const trimmedProductId = value.product_id.trim();

    // Check if the medicine exists in the source inventory
    const medValue = await pharmacyPool.query(
      "SELECT * FROM inventory WHERE product_id = $1 AND rhu_id = $2",
      [trimmedProductId, rhu_id]
    );

    if (medValue.rows.length === 0) {
      req.flash("error", "Medicine not available in inventory");
      return res.redirect("/pharmacy-inventory");
    }

    const data = medValue.rows[0];

    // Check if the stock is sufficient
    if (data.product_quantity < value.product_quantity) {
      req.flash("error", "Not enough stock available");
      return res.redirect("/pharmacy-inventory");
    }

    // Check if the medicine already exists in the target RHU
    const targetMed = await pharmacyPool.query(
      "SELECT * FROM inventory WHERE product_id = $1 AND rhu_id = $2",
      [trimmedProductId, value.rhu_id]
    );

    if (targetMed.rows.length === 0) {
      // If medicine does not exist in the target RHU, insert it
      await pharmacyPool.query(`
        INSERT INTO inventory (product_id, product_code, product_name, brand_name, supplier, product_quantity, dosage_form, dosage, reorder_level, batch_number, expiration, date_added, rhu_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        data.product_id, data.product_code, data.product_name, data.brand_name, data.supplier, value.product_quantity,
        data.dosage_form, data.dosage, data.reorder_level, data.batch_number, data.expiration, data.date_added, value.rhu_id
      ]);
    } else {
      // If medicine exists, just update the quantity
      const newTargetQuantity = targetMed.rows[0].product_quantity + value.product_quantity;
      await pharmacyPool.query(`
        UPDATE inventory 
        SET product_quantity = $1 
        WHERE product_id = $2 AND rhu_id = $3`,
        [newTargetQuantity, trimmedProductId, value.rhu_id]
      );
    }

    // Update the source inventory by subtracting the transferred quantity
    const newProductQuantity = data.product_quantity - value.product_quantity;
    await pharmacyPool.query(`
      UPDATE inventory 
      SET product_quantity = $1 
      WHERE product_id = $2 AND rhu_id = $3`,
      [newProductQuantity, trimmedProductId, rhu_id]
    );
    req.flash("success", "Medicine Transfer Successfully");
    return res.redirect("/pharmacy-inventory");
  } catch (err) {
    req.flash("error", err);
    return res.redirect("/pharmacy-inventory");
  }
});

router.post("/pharmacy-records/add-beneficiary", upload.single('picture'), async (req, res) => {
  const { error, value } = beneficiarySchema.validate(req.body);
  const picture = req.file ? req.file.filename : null;

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    if (picture) {
      console.log(`Processed file: ${picture}`);
    } else {
      console.log("No file received or file upload failed");
    }

    await pharmacyPool.query(
      `INSERT INTO beneficiary (last_name, first_name, middle_name, phone, gender, birthdate, street, barangay, city, province, occupation, senior_citizen, pwd, picture, note, processed_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [value.last_name, value.first_name, value.middle_name, value.phone, value.gender, value.birthdate, value.street, value.barangay, value.city, value.province, value.occupation, value.senior_citizen, value.pwd, picture, value.note, value.processed_date]
    );
    req.flash("success", "Beneficiary Added Successfully");
    res.redirect("/pharmacy-records");
  } catch (err) {
    req.flash("error", err);
    return res.redirect("/pharmacy-records");
  }
});

router.post('/pharmacy-records/update', upload.single('picture'), async (req, res) => {
  const { error, value } = beneficiarySchema.validate(req.body);
  const existingPicture = value.existing_picture;
  const picture = req.file ? req.file.filename : existingPicture;

  // Validate beneficiary ID
  if (isNaN(value.beneficiary_id)) {
    return res.status(400).json({ message: 'Invalid beneficiary ID' });
  }

  // Validate schema
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const result = await pharmacyPool.query(
      `UPDATE beneficiary 
       SET last_name = $1, first_name = $2, middle_name = $3, gender = $4, birthdate = $5, processed_date = $6, phone = $7, occupation = $8, senior_citizen = $9, pwd = $10, street = $11, barangay = $12, city = $13, province = $14, note = $15, picture = $16
       WHERE beneficiary_id = $17`,
      [
        value.last_name,
        value.first_name,
        value.middle_name,
        value.gender,
        value.birthdate,
        value.processed_date,
        value.phone,
        value.occupation,
        value.senior_citizen,
        value.pwd,
        value.street,
        value.barangay,
        value.city,
        value.province,
        value.note,
        picture,
        value.beneficiary_id
      ]
    );

    // Check if the update was successful
    if (result.rowCount > 0) {
      req.flash("success", "Beneficiary updated successfully");
      return res.redirect("/pharmacy-records");
    } else {
      req.flash("error", 'Beneficiary not found.');
      return res.redirect("/pharmacy-records");
    }
  } catch (err) {
    req.flash("error", err);
    return res.redirect("/pharmacy-records");
  }
});

router.post("/pharmacy/dispense-medicine/send", async (req, res) => {
  const { error, value } = dispenseSchema.validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const {
    beneficiary_id,
    transaction_number,
    date_issued,
    doctor,
    receiver,
    relationship_beneficiary,
    medicines,
    diagnosis,
    findings
  } = value;

  const transactionNumber = transaction_number;

  const client = await pharmacyPool.connect();
  try {
    await client.query('BEGIN');

    // Check if beneficiary exists
    const beneficiaryCheckQuery = `
      SELECT beneficiary_id FROM beneficiary WHERE beneficiary_id = $1
    `;
    const beneficiaryResult = await client.query(beneficiaryCheckQuery, [beneficiary_id]);

    if (beneficiaryResult.rowCount === 0) {
      req.flash("error", `Beneficiary ID ${beneficiary_id} not found`);
      return res.redirect("/pharmacy-dispense-request");
    }

    // Check if the beneficiary has requested the same medicine within the last 25 days
    for (const medicine of medicines) {
      const { product_id } = medicine;
      const recentTransactionQuery = `
        SELECT tm.id
        FROM transaction_records tr
        JOIN transaction_medicine tm ON tr.id = tm.tran_id
        WHERE tr.beneficiary_id = $1
          AND tm.product_id = $2
          AND tr.date_issued >= (CURRENT_DATE - INTERVAL '25 days')
      `;
      const recentTransactionResult = await client.query(recentTransactionQuery, [beneficiary_id, product_id]);

      if (recentTransactionResult.rowCount > 0) {
        await client.query('ROLLBACK');
        req.flash("error", `Beneficiary has requested the medicine with product ID: ${product_id} twice in the last 25 days . Dispensing not allowed.`);
        return res.redirect("/pharmacy-dispense-request");
      }
    }

    // Insert into transaction_records
    const insertTransactionQuery = `
      INSERT INTO transaction_records (beneficiary_id, transaction_number, date_issued, doctor, reciever, relationship_beneficiary, diagnosis, findings)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `;
    const transactionResult = await client.query(insertTransactionQuery, [beneficiary_id, transactionNumber, date_issued, doctor, receiver, relationship_beneficiary, diagnosis, findings]);
    const transactionId = transactionResult.rows[0].id;

    // Deduct quantities and insert into transaction_medicine
    for (const medicine of medicines) {
      const { product_id, quantity, batch_number, product_details } = medicine;

      // Check if the stock is sufficient
      const checkInventoryQuery = `
        SELECT product_quantity FROM inventory 
        WHERE product_id = $1 
          AND batch_number = $2
      `;
      const inventoryResult = await client.query(checkInventoryQuery, [product_id, batch_number]);

      if (inventoryResult.rowCount === 0 || inventoryResult.rows[0].product_quantity < quantity) {
        await client.query('ROLLBACK');
        req.flash("error", `Insufficient stock for product ID: ${product_id}, batch number: ${batch_number}`);
        return res.redirect("/pharmacy-dispense-request");
      }

      // Update inventory to deduct the quantity
      const updateInventoryQuery = `
        UPDATE inventory 
        SET product_quantity = product_quantity - $1 
        WHERE product_id = $2 
          AND batch_number = $3 
          AND product_quantity >= $1
      `;
      const result = await client.query(updateInventoryQuery, [quantity, product_id, batch_number]);

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        req.flash("error", `Not enough stock for product ID: ${product_id}, batch number: ${batch_number}`);
        return res.redirect("/pharmacy-dispense-request");
      }

      // Insert into transaction_medicine
      const insertMedicineQuery = `
        INSERT INTO transaction_medicine (tran_id, product_id, batch_number, product_details, quantity)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(insertMedicineQuery, [transactionId, product_id, batch_number, product_details, quantity]);
    }

    // Delete the records from patient patient_prescription_data
    await rhuPool.query(`
        DELETE FROM patient_prescription_data WHERE patient_prescription_id = $1
      `, [value.patient_prescription_id]);

    await client.query('COMMIT');
    req.flash("success", "Medicine dispensed Successfully");
    return res.redirect("/pharmacy-dispense-request");

  } catch (err) {
    await client.query('ROLLBACK');
    req.flash("error", err.message || "An error occurred");
    return res.redirect("/pharmacy-dispense-request");
  } finally {
    client.release();
  }
});

router.post("/pharmacy/reject-dispense", async (req, res) => {
  const { error, value } = dispenseSchema.validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    await rhuPool.query(`DELETE FROM patient_prescription_data WHERE patient_prescription_id = $1`, [value.patient_prescription_id]);
    req.flash("success", "Successfully removed from dispense request");
    return res.redirect("/pharmacy-dispense-request");
  } catch (err) {
    req.flash("error", err);
    return res.redirect("/pharmacy-dispense-request");
  }
});

router.delete('/pharmacy-records/delete/:id', async (req, res) => {
  const beneficiaryId = parseInt(req.params.id);

  if (isNaN(beneficiaryId)) {
    return res.status(400).json({ message: 'Invalid beneficiary ID' });
  }

  try {
    const result = await pharmacyPool.query(
      'SELECT 1 FROM beneficiary WHERE beneficiary_id = $1',
      [beneficiaryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Beneficiary not found.' });
    }

    const picture = result.rows[0].picture;

    const deleteResult = await pharmacyPool.query(
      'DELETE FROM beneficiary WHERE beneficiary_id = $1',
      [beneficiaryId]
    );

    if (deleteResult.rowCount > 0) {
      if (picture) {
        const filePath = path.join(__dirname, '../../uploads/beneficiary-img/', picture);

        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('Failed to delete image file:', err);
          } else {
            console.log('Image file deleted:', filePath);
          }
        });
      }
    } else {
      res.status(404).json({ message: 'Beneficiary not found.' });
    }
    req.flash("success", "Beneficiary Deleted Successfully");
    return res.redirect("/pharmacy-records");
  } catch (error) {
    req.flash("error", err);
    return res.redirect("/pharmacy-records");
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

async function fetchInventoryList(page, limit, rhu_id) {
  const offset = (page - 1) * limit;

  try {
    const query = `
      SELECT *, COUNT(*) OVER() AS total_count
      FROM inventory
      WHERE rhu_id = $1
      ORDER BY product_name
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await pharmacyPool.query(query, [rhu_id, limit, offset]);

    const totalItems = rows.length > 0 ? rows[0].total_count : 0;
    const totalPages = Math.ceil(totalItems / limit);

    const data = rows.map(row => ({
      ...row,
      expiration: formatDate(row.expiration),
    }));

    return { getInventoryList: data, totalPages };
  } catch (err) {
    console.error("Error: ", err);
    throw new Error("Error fetching inventory list");
  }
}

async function getQuantityNotification(rhu_id) {
  try {
    const query = `
    SELECT product_name, product_code, product_quantity
    FROM inventory
    WHERE rhu_id = $1 AND product_quantity <= 500;
    `;
    const { rows } = await pharmacyPool.query(query, [rhu_id]);
    const data = rows.map(row => ({
      ...row
    }));
    return { quantityNotif: data };
  } catch (error) {
    console.error("Error: ", error);
  }
}

async function fetchBeneficiaryList(page, limit) {
  const offset = (page - 1) * limit;

  try {
    const totalItemsResult = await pharmacyPool.query("SELECT COUNT(*) FROM beneficiary");
    const totalItems = parseInt(totalItemsResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    const beneficiaryList = await pharmacyPool.query(
      `WITH medicine_agg AS (
          SELECT tm.tran_id,
                 json_agg(
                   json_build_object(
                     'product_id', tm.product_id,
                     'batch_number', tm.batch_number,
                     'product_details', tm.product_details,
                     'quantity', tm.quantity
                   )
                 ) AS medicines
          FROM transaction_medicine tm
          GROUP BY tm.tran_id
      )
      SELECT b.*, 
             COALESCE(json_agg(
               json_build_object(
                 'id', t.id,
                 'transaction_number', t.transaction_number,
                 'date_issued', t.date_issued,
                 'doctor', t.doctor,
                 'reciever', t.reciever,
                 'relationship_beneficiary', t.relationship_beneficiary,
                 'medicines', COALESCE(m.medicines, '[]')
               )
             ) FILTER (WHERE t.id IS NOT NULL), '[]') AS transaction_records
      FROM beneficiary b
      LEFT JOIN transaction_records t ON b.beneficiary_id = t.beneficiary_id
      LEFT JOIN medicine_agg m ON t.id = m.tran_id
      GROUP BY b.beneficiary_id
      ORDER BY b.first_name
      LIMIT $1 OFFSET $2`, [limit, offset]
    );

    const data = beneficiaryList.rows.map(row => ({
      ...row,
      middle_name: row.middle_name ? row.middle_name : '',
      age: calculateAge(row.birthdate),
      senior_citizen: isSeniorCitizen(row.age),
      transaction_records: row.transaction_records ? row.transaction_records : []
    }));

    return { getBeneficiaryList: data, totalPages };
  } catch (err) {
    console.error("Error: ", err);
    throw new Error("Error fetching beneficiary list");
  }
}

async function fetchDispenseList(page, limit, rhu_id) {
  const offset = (page - 1) * limit;

  try {
    // Get the total number of items with the specific rhu_id
    const totalItemsResult = await rhuPool.query(
      "SELECT COUNT(*) FROM patient_prescription_data WHERE rhu_id = $1",
      [rhu_id]
    );
    const totalItems = parseInt(totalItemsResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch the list of prescriptions for the specific rhu_id
    const dispenseList = await rhuPool.query(
      `SELECT pd.*, 
              pt.*, 
              COALESCE(json_agg(p) FILTER (WHERE p.id IS NOT NULL), '[]') AS prescription 
       FROM patient_prescription_data pd
       LEFT JOIN prescription p ON pd.patient_prescription_id = p.patient_prescription_id
       LEFT JOIN patients pt ON pd.patient_id = pt.patient_id
       WHERE pd.rhu_id = $3
       GROUP BY pd.patient_prescription_id, pt.patient_id
       LIMIT $1 OFFSET $2`, [limit, offset, rhu_id]
    );

    const data = dispenseList.rows.map(row => ({
      ...row
    }));

    return { getDispenseList: data, totalPages };
  } catch (err) {
    console.error("Error: ", err);
    throw new Error("Error fetching dispense list");
  }
}

function isSeniorCitizen(age) {
  return age >= 60 ? 'Yes' : 'No';
}

function generateNextTransactionId(lastId) {
  const match = lastId.match(/^([A-Z]+)(\d+)$/);

  if (match) {
    const prefix = match[1];
    const number = parseInt(match[2], 10);

    const newNumber = number + 1;
    return `${prefix}${String(newNumber).padStart(4, "0")}`;
  }

  return "T0001";
}

module.exports = router;