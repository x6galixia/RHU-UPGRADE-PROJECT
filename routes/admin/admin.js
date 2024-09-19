const express = require("express");
const router = express.Router();

router.get("/admin-dashboard", (req, res) => {
    res.render("admin/admin-dashboard");
});

router.get("/admin-users", (req, res) => {
    res.render("admin/admin-users");
})


router.get("/sign-in", (req, res) => {
    res.render("admin/sign-in");
})

module.exports = router;