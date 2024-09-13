const express = require("express");
const router = express.Router();

//------IMPORTING PHARMACY DATABASE------//
const pharmacyPool = require("../../models/pharmacydb");

//-------ROUTE FOR PHARMACY INVENTORY-------//
router.get("/pharmacy-inventory", (req, res) => {
  res.render("pharmacy/inventory");
});

//-------ROUTE FOR PHARMACY BENEFICIARY RECORDS-------//
router.get("/pharmacy-records", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  
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
  const { query } = req.query;

  if (!query) {
    return res.status(400).send("Query parameter is required");
  }

  try {
    const searchResult = await pharmacyPool.query(
      `SELECT * FROM beneficiary 
       WHERE CONCAT(first_name, ' ', last_name) ILIKE $1
       OR first_name ILIKE $1
       OR last_name ILIKE $1
       LIMIT 100`,
      [`%${query}%`]
    );

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

//-------FUNCTIONS------//

//-------FETCHING PAGINATED LIST OF BENEFICIARIES-------//
async function fetchBeneficiaryList(page, limit) {
  const offset = (page - 1) * limit;
  try {
    const totalCountResult = await pharmacyPool.query("SELECT COUNT(*) FROM beneficiary");
    const totalCount = parseInt(totalCountResult.rows[0].count);
    
    const beneficiaryList = await pharmacyPool.query(
      `SELECT * FROM beneficiary ORDER BY id LIMIT $1 OFFSET $2`, [limit, offset]
    );
    
    const data = beneficiaryList.rows.map(row => ({
      ...row,
      middle_name: row.middle_name ? row.middle_name.charAt(0) : '',
      age : calculateAge(row.birthdate),
      senior_citizen : isSeniorCitizen(row.age)
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return { getBeneficiaryList: data, totalPages: totalPages || 1 };
  } catch (err) {
    console.error("Error: ", err);
    return { getBeneficiaryList: [], totalPages: 0 };
  }
}

//-------AUTOMATIC CALCULATION OF AGE-------//
//we add a automation in calculation of age to
//make sure the age is always updated

function calculateAge(birthdateString) {
  const birthdate = new Date(birthdateString);
  const today = new Date();

  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDifference = today.getMonth() - birthdate.getMonth();
  const dayDifference = today.getDate() - birthdate.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age--;
  }
  return age;
}
//-------AUTOMATIC CALCULATION OF SENIOR CITIZEN-------//
//we added a automation to update if the beneficiary
//is a senior citizen or not based on his/her age
function isSeniorCitizen(age){
  return age >= 60 ? 'Yes' : 'No';
}

module.exports = router;