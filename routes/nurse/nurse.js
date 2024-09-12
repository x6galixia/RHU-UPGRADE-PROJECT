const express = require("express");
const router = express.Router();

router.get("/nurse-dashboard", (req, res) => {
  res.render("nurse/nurse-dashboard");
});

module.exports = router;