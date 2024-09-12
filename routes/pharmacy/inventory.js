const express = require("express");
const router = express.Router();

router.get("/pharmacy-inventory", (req, res) => {
  res.render("pharmacy/inventory");
});

module.exports = router;
