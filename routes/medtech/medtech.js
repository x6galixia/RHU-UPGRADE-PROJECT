const express = require("express");
const router = express.Router();

router.get("/medtech-dashboard", (req, res) => {
  res.render("medtech/medtech-dashboard");
});

module.exports = router;