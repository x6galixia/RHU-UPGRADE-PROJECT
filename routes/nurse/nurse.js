const express = require("express");
const router = express.Router();

router.get("/nurse-dashboard", (req, res) => {
  res.render("nurse/nurse-dashboard");
});

router.get("/nurse/patient-registration", (req, res) => {
  res.render("nurse/patient-registration");
});


router.get("/nurse/individual-health-assesment", (req, res) => {
  res.render("nurse/individual-health-assesment");
});

module.exports = router;