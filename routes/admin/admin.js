const express = require("express");
const router = express.Router();

router.get("/admin-dashboard", (req, res) => {
    res.render("admin/admin-dashboard");
})

module.exports = router;