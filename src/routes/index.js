// routes/index.js
const express = require("express");
const router = express.Router();

router.use("/", require("./login/login"));
router.use("/", require("./admin/admin"));
router.use("/", require("./nurse/nurse"));
router.use("/", require("./doctor/doctor"));
router.use("/", require("./medtech/medtech"));
router.use("/", require("./pharmacy/pharmacy"));

module.exports = router;