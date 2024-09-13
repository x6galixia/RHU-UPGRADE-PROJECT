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
      totalPages 
    });
  } catch (err) {
    console.error("Error: ", err);
    res.sendStatus(500);
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
      middle_name: row.middle_name ? row.middle_name.charAt(0) : null
    }));

    const totalPages = Math.ceil(totalCount / limit);
    
    return { getBeneficiaryList: data, totalPages };
  } catch (err) {
    console.error("Error: ", err);
    return { getBeneficiaryList: [], totalPages: 0 };
  }
}

module.exports = router;
