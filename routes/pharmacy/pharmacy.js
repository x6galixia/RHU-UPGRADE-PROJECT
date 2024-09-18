const express = require("express");
const Joi = require('joi');
const router = express.Router();

const pharmacyPool = require("../../models/pharmacydb");
const {calculateAge, formatDate} = require("../../public/js/global/functions");
const {setUserData, ensureAuthenticated, checkUserType} = require("../../middlewares/middleware");

router.use(setUserData);

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

router.get("/pharmacy-inventory", ensureAuthenticated, checkUserType("Pharmacist"), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isAjax = req.query.ajax === "true";

  try {
    const { getInventoryList, totalPages } = await fetchInventoryList(page, limit, req.user.rhu_id);

    if (isAjax) {
      return res.json({ getInventoryList, totalPages });
    }
    
    res.render("pharmacy/inventory", {
      getInventoryList, 
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
         LIMIT 100`,
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
      return res.json({ getBeneficiaryList, totalPages });
    }
    
    res.render("pharmacy/beneficiary-records", { 
      getBeneficiaryList, 
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
         LIMIT 100`,
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

router.get("/pharmacy-dispense-request", ensureAuthenticated, checkUserType("Pharmacist"), (req, res) => {
  res.render("pharmacy/requests-for-dispense");
});

router.get("/pharmacy-index-form", ensureAuthenticated, checkUserType("Pharmacist"), (req, res) => {
  res.render("pharmacy/beneficiary-index-form");
});

router.get("/pharmacy-request", ensureAuthenticated, checkUserType("Pharmacist"), (req, res) => {
  res.render("pharmacy/pharmacy-request");
});

router.get("/pharmacy-trends", ensureAuthenticated, checkUserType("Pharmacist"), (req, res) => {
  res.render("pharmacy/trends");
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
      `SELECT * FROM beneficiary ORDER BY first_name LIMIT $1 OFFSET $2`, [limit, offset]
    );

    const data = beneficiaryList.rows.map(row => ({
      ...row,
      middle_name: row.middle_name ? row.middle_name : '',
      age: calculateAge(row.birthdate),
      senior_citizen: isSeniorCitizen(row.age)
    }));

    return { getBeneficiaryList: data, totalPages };
  } catch (err) {
    console.error("Error: ", err);
    throw new Error("Error fetching beneficiary list");
  }
}

function isSeniorCitizen(age) {
  return age >= 60 ? 'Yes' : 'No';
}

module.exports = router;