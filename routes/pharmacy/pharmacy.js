const express = require("express");
const Joi = require('joi');
const router = express.Router();

const medicineSchema = Joi.object({
  product_id: Joi.string().required(),
  product_code: Joi.string().required(),
  product_name: Joi.string().required(),
  brand_name: Joi.string().required(),
  supplier: Joi.string().required(),
  product_quantity: Joi.number().integer().min(1).required(),
  dosage_form: Joi.string().required(),
  dosage: Joi.string().required(),
  reorder_level: Joi.number().integer().min(0).required(),
  batch_number: Joi.string().required(),
  expiration: Joi.date().required(),
  date_added: Joi.date().required()
});

//------IMPORTING PHARMACY DATABASE------//
const pharmacyPool = require("../../models/pharmacydb");

//------IMPORTING MIDDLEWARES-------//
const {calculateAge, formatDate} = require("../../public/js/global/functions");

//-------ROUTE FOR PHARMACY INVENTORY-------//
router.get("/pharmacy-inventory", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const { getInventoryList, totalPages } = await fetchInventoryList(page, limit);
    
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

//-------ROUTE FOR SEARCHING MEDICINE IN INVENTORY-------//
router.get("/pharmacy-inventory/search", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { query } = req.query;

  try {
    let searchResult;

    if (!query) {
      searchResult = await pharmacyPool.query(
        `SELECT * FROM inventory ORDER BY product_name LIMIT $1 OFFSET $2`, [limit, offset]
      );
    } else {
      searchResult = await pharmacyPool.query(
        `SELECT * FROM inventory 
         WHERE CONCAT(product_name, ' ', brand_name) ILIKE $1
         OR product_name ILIKE $1
         OR brand_name ILIKE $1
         LIMIT 100`,
        [`%${query}%`]
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


//-------ROUTE FOR PHARMACY BENEFICIARY RECORDS-------//
router.get("/pharmacy-records", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    const { getBeneficiaryList, totalPages } = await fetchBeneficiaryList(page, limit);
    
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

//-------ROUTE FOR SEARCHING BENEFICIARY RECORDS-------//
router.get("/pharmacy-records/search", async (req, res) => {
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
         WHERE CONCAT(first_name, ' ', last_name) ILIKE $1
         OR first_name ILIKE $1
         OR last_name ILIKE $1
         LIMIT 100`,
        [`%${query}%`]
      );
    }

    const data = searchResult.rows.map(row => ({
      ...row,
      middle_name: row.middle_name ? row.middle_name.charAt(0) : '',
      age : calculateAge(row.birthdate),
      senior_citizen : isSeniorCitizen(row.age)
    }));

    res.json({ getBeneficiaryList: data });
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).send("An error occurred during the search.");
  }
});

//-------ROUTE FOR PHARMACY BENEFICIARY INDEX FORM------//
router.get("/pharmacy-index-form", (req, res) => {
  res.render("pharmacy/beneficiary-index-form");
});

//-------ROUTE FOR PHARMACY TRENDS------//
router.get("/pharmacy-trends", (req, res) => {
  res.render("pharmacy/trends");
});

//--------ROUTE FOR ADDING A MEDICINE TO THE INVENTORY-------//
//--------NEEDS TO BE UPDATED ONES WE HAVE A USER LOGIN-------//
//--------USER ID SHOULD BE QUERIED ALONG WITH THE MEDICINE INFO--------//

router.post("/pharmacy-inventory/add-medicine", async (req, res) => {
  const { error, value } = medicineSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    await pharmacyPool.query(`
      INSERT INTO inventory (product_id, product_code, product_name, brand_name, supplier, product_quantity, dosage_form, dosage, reorder_level, batch_number, expiration, date_added)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, 
      [value.product_id, value.product_code, value.product_name, value.brand_name, value.supplier, value.product_quantity, value.dosage_form, value.dosage, value.reorder_level, value.batch_number, value.expiration, value.date_added]);    
    res.redirect("/pharmacy-inventory");
  } catch (err) {
    console.error("Error: ", err);
    res.sendStatus(500);
  }
});

//-------FUNCTIONS------//

//-------FETCHING PAGINATED LIST OF BENEFICIARIES-------//
async function fetchBeneficiaryList(page, limit) {
  const offset = (page - 1) * limit;

  try {
    const totalCountResult = await pharmacyPool.query("SELECT COUNT(*) FROM beneficiary");
    const totalCount = parseInt(totalCountResult.rows[0].count);
    
    const beneficiaryList = await pharmacyPool.query(
      `SELECT * FROM beneficiary ORDER BY first_name LIMIT $1 OFFSET $2`, [limit, offset]
    );
    
    const data = beneficiaryList.rows.map(row => ({
      ...row,
      middle_name: row.middle_name ? row.middle_name.charAt(0) : '',
      age: calculateAge(row.birthdate),
      senior_citizen: isSeniorCitizen(row.age)
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return { getBeneficiaryList: data, totalPages: totalPages || 1 };
  } catch (err) {
    console.error("Error: ", err);
    return { getBeneficiaryList: [], totalPages: 0 };
  }
}

//-------FETCHING PAGINATED LIST OF INVENTORY-------//
async function fetchInventoryList(page, limit) {
  const offset = (page - 1) * limit;

  try {
    const totalCountResult = await pharmacyPool.query("SELECT COUNT(*) FROM inventory");
    const totalCount = parseInt(totalCountResult.rows[0].count);

    const inventoryList = await pharmacyPool.query(
      `SELECT * FROM inventory ORDER BY product_name LIMIT $1 OFFSET $2`, [limit, offset]
    );

    const data = inventoryList.rows.map(row => ({
      ...row,
      expiration: formatDate(row.expiration)
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return { getInventoryList: data, totalPages: totalPages || 1 };
  } catch (err) {
    console.error("Error: ", err);
    return { getInventoryList: [], totalPages: 0 };
  }
}

//-------AUTOMATIC CALCULATION OF SENIOR CITIZEN-------//
//we added a automation to update if the beneficiary
//is a senior citizen or not based on his/her age

function isSeniorCitizen(age){
  return age >= 60 ? 'Yes' : 'No';
}

module.exports = router;