const express = require("express");
const router = express.Router();

router.get("/pharmacy-inventory", (req, res) => {
  res.render("pharmacy/inventory");
});

router.get("/pharmacy-records", (req, res) => {
  res.render("pharmacy/beneficiary-records");
});

router.get("/pharmacy-index-form", (req, res) => {
  res.render("pharmacy/beneficiary-index-form");
});
router.get("/pharmacy-trends", (req, res) => {
  res.render("pharmacy/trends");
});

module.exports = router;
