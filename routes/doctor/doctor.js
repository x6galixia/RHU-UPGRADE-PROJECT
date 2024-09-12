const express = require("express");
const router = express.Router();

router.get("/doctor-dashboard", (req, res) => {
  res.render("doctor/doctor-dashboard");
});

module.exports = router;