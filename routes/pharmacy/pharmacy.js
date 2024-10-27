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
  date_added: Joi.date().optional()
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
  existing_picture: Joi.string().optional()
});

const upload = multer({ storage: storage });
router.use("/uploads/beneficiary-img", express.static("uploads"));

router.get("/pharmacy-inventory", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isAjax = req.query.ajax === "true";

  try {
    const { getInventoryList, totalPages } = await fetchInventoryList(page, limit, req.user.rhu_id);

    if (isAjax) {
      return res.json({
        getInventoryList,
        user: req.user,
        currentPage: page,
        totalPages,
        limit
      });
    }

    res.render("pharmacy/inventory", {
      getInventoryList,
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

router.get("/pharmacy-dispense", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isAjax = req.query.ajax === "true";

  try {
    const { getDispenseList, totalPages } = await fetchDispenseList(page, limit);

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

router.get("/pharmacy-dispense-request", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isAjax = req.query.ajax === "true";

  try {
    const { getDispenseList, totalPages } = await fetchDispenseList(page, limit);

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

router.get("/pharmacy-records/search", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { query } = req.query;

  try {
    let searchResult;

    if (!query) {
      searchResult = await pharmacyPool.query(
        `SELECT * FROM beneficiary ORDER BY first_name LIMIT $1 OFFSET $2`, [limit, offset]
      );
    } else {
      searchResult = await pharmacyPool.query(
        `SELECT * FROM beneficiary 
         WHERE CONCAT(first_name, ' ', middle_name, ' ', last_name) ILIKE $1
         OR CONCAT(first_name,' ', last_name) ILIKE $1
         OR first_name ILIKE $1
         OR middle_name ILIKE $1
         OR last_name ILIKE $1
         LIMIT 10`,
        [`%${query}%`]
      );
    }

    const data = searchResult.rows.map(row => ({
      ...row,
      middle_name: row.middle_name ? row.middle_name : '',
      age: calculateAge(row.birthdate),
      senior_citizen: isSeniorCitizen(row.age)
    }));

    res.json({ getBeneficiaryList: data });
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).send("An error occurred during the search.");
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

router.post("/pharmacy-inventory/add-medicine", async (req, res) => {
  const { error, value } = medicineSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    await pharmacyPool.query(`
      INSERT INTO inventory (product_id, product_code, product_name, brand_name, supplier, product_quantity, dosage_form, dosage, reorder_level, batch_number, expiration, date_added, rhu_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [value.product_id, value.product_code, value.product_name, value.brand_name, value.supplier, value.product_quantity, value.dosage_form, value.dosage, value.reorder_level, value.batch_number, value.expiration, value.date_added, 1]
    );
    res.redirect("/pharmacy-inventory");
  } catch (err) {
    console.error("Error: ", err);
    res.sendStatus(500);
  }
});

router.post("/pharmacy-inventory/restock-medicine", async (req, res) => {
  const { error, value } = medicineSchema.validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    await pharmacyPool.query(
      "UPDATE inventory SET batch_number = $4, date_added = $5, expiration = $6, product_quantity = $7 WHERE product_id = $1 AND product_code = $2 AND rhu_id = $3",
      [value.product_id, value.product_code, 1, value.batch_number, value.date_added, value.expiration, value.product_quantity]
    );
    res.redirect("/pharmacy-inventory");
  } catch (err) {
    console.error("Error: ", err);
    res.status(400).send("Error updating medicine");
  }
});

router.post("/pharmacy-inventory/transfer-medicine", async (req, res) => {
  const { error, value } = medicineSchema.validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    const trimmedProductId = value.product_id.trim();

    const medValue = await pharmacyPool.query("SELECT * FROM inventory WHERE product_id = $1", [trimmedProductId]);

    if (medValue.rows.length === 0) {
      return res.status(404).send(`Medicine with product_id ${value.product_id} is not available`);
    }

    const data = medValue.rows[0];

    if (data.product_quantity < value.product_quantity) {
      return res.status(400).send(`Not enough stock available. Available quantity: ${data.product_quantity}`);
    }

    await pharmacyPool.query(`
      INSERT INTO inventory (product_id, product_code, product_name, brand_name, supplier, product_quantity, dosage_form, dosage, reorder_level, batch_number, expiration, date_added, rhu_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [data.product_id, data.product_code, data.product_name, data.brand_name, data.supplier, value.product_quantity, data.dosage_form, data.dosage, data.reorder_level, data.batch_number, data.expiration, data.date_added, value.rhu_id]);

    const newProductQuantity = data.product_quantity - value.product_quantity
    await pharmacyPool.query(`
      UPDATE inventory 
      SET product_quantity = $1 
      WHERE product_id = $2 AND rhu_id = $3`,
      [newProductQuantity, trimmedProductId, 1]
    );

    res.redirect("/pharmacy-inventory");
  } catch (err) {
    console.error("Error: ", err);
    res.status(400).send("Error transferring medicine");
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

    res.redirect("/pharmacy-records");
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).send("Failed to add beneficiary.");
  }
});

router.post('/pharmacy-records/update', upload.single('picture'), async (req, res) => {
  const { error, value } = beneficiarySchema.validate(req.body);
  const existingPicture = value.existing_picture;
  const picture = req.file ? req.file.filename : existingPicture;

  if (isNaN(value.beneficiary_id)) {
    return res.status(400).json({ message: 'Invalid beneficiary ID' });
  }

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const result = await pharmacyPool.query(
      `UPDATE beneficiary 
       SET last_name = $1, first_name = $2, middle_name = $3, gender = $4, birthdate = $5, processed_date = $6, phone = $7, occupation = $8, senior_citizen = $9, pwd = $10, street = $11, barangay = $12, city = $13, province = $14, note = $15, picture = $16
       WHERE beneficiary_id = $17`,
      [value.last_name, value.first_name, value.middle_name, value.gender, value.birthdate, value.processed_date, value.phone, value.occupation, value.senior_citizen, value.pwd, value.street, value.barangay, value.city, value.province, value.note, picture, value.beneficiary_id]
    );

    if (result.rowCount > 0) {
      res.redirect("/pharmacy-records");
    } else {
      res.status(404).json({ message: 'Beneficiary not found.' });
    }
  } catch (error) {
    console.error('Error updating beneficiary:', error);
    res.status(500).json({ message: 'Failed to update the beneficiary.' });
  }
});

router.delete('/pharmacy-records/delete/:id', async (req, res) => {
  const beneficiaryId = parseInt(req.params.id);

  if (isNaN(beneficiaryId)) {
    return res.status(400).json({ message: 'Invalid beneficiary ID' });
  }

  try {
    const result = await pharmacyPool.query(
      'SELECT picture FROM beneficiary WHERE beneficiary_id = $1',
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

      res.json({ message: 'Beneficiary deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Beneficiary not found.' });
    }
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    res.status(500).json({ message: 'Failed to delete the beneficiary.' });
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

async function fetchInventoryList(page, limit, rhu_id) {
  const offset = (page - 1) * limit;

  try {
    const totalItemsResult = await pharmacyPool.query("SELECT COUNT(*) FROM inventory WHERE rhu_id = $1", [rhu_id]);
    const totalItems = parseInt(totalItemsResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    const inventoryList = await pharmacyPool.query(
      `SELECT * FROM inventory WHERE rhu_id = $3 ORDER BY product_name LIMIT $1 OFFSET $2`, [limit, offset, rhu_id]
    );

    const data = inventoryList.rows.map(row => ({
      ...row,
      expiration: formatDate(row.expiration)
    }));

    return { getInventoryList: data, totalPages };
  } catch (err) {
    console.error("Error: ", err);
    throw new Error("Error fetching inventory list");
  }
}

async function fetchBeneficiaryList(page, limit) {
  const offset = (page - 1) * limit;

  try {
    const totalItemsResult = await pharmacyPool.query("SELECT COUNT(*) FROM beneficiary");
    const totalItems = parseInt(totalItemsResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    const beneficiaryList = await pharmacyPool.query(
      `SELECT b.*, 
              COALESCE(json_agg(t) FILTER (WHERE t.id IS NOT NULL), '[]') AS transaction_records 
       FROM beneficiary b
       LEFT JOIN transaction_records t ON b.beneficiary_id = t.beneficiary_id
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

async function fetchDispenseList(page, limit) {
  const offset = (page - 1) * limit;

  try {
    const totalItemsResult = await rhuPool.query("SELECT COUNT(*) FROM patient_prescription_data");
    const totalItems = parseInt(totalItemsResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    const dispenseList = await rhuPool.query(
      `SELECT pd.*, 
              pt.*, 
              COALESCE(json_agg(p) FILTER (WHERE p.id IS NOT NULL), '[]') AS prescription 
       FROM patient_prescription_data pd
       LEFT JOIN prescription p ON pd.patient_prescription_id = p.patient_prescription_id
       LEFT JOIN patients pt ON pd.patient_id = pt.patient_id
       GROUP BY pd.patient_prescription_id, pt.patient_id
       LIMIT $1 OFFSET $2`, [limit, offset]
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

router.get("/pharmacy/generate-transaction-id/new-id", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  try {
    const result = await pharmacyPool.query(
      "SELECT transaction_number FROM transaction_records ORDER BY transaction_number DESC LIMIT 1"
    );

    console.log('Query result:', result.rows);

    let lastId = "T0000";
    if (result.rows.length > 0 && result.rows[0].transaction_number) {
      lastId = result.rows[0].transaction_number;
    }

    console.log('Last ID:', lastId);
    const newId = generateNextTransactionId(lastId);
    res.json({ id: newId });
  } catch (err) {
    console.error("Error generating ID:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

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