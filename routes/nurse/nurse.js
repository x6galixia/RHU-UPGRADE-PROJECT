const express = require("express");
const router = express.Router();

router.get("/nurse-dashboard", (req, res) => {
  res.render("nurse/nurse-dashboard");
});

router.get("/nurse/patient-registration", (req, res) => {
  res.render("nurse/patient-registration");
});

module.exports = router;