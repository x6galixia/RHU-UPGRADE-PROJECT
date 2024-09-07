const express = require("express");
const router = express.Router();

router.get("/preview", (req, res) => {
    res.send("preview");
})

module.exports = router;