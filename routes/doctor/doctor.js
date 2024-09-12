const express = require("express");
const router = express.Router();

router.get("/doctor-dashboard", (req, res) => {
  res.render("doctor/doctor-dashboard");
});

router.get("/doctor/patient-history", (req, res) => {
  res.render("doctor/patient-history");
});

module.exports = router;