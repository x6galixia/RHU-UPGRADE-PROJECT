const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
  res.render("doctor/doctor-dashboard");
});

module.exports = router;