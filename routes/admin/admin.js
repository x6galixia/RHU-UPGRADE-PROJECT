const express = require("express");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require("bcrypt");

const userSchema = Joi.object({
    rhu_id: Joi.number().integer().required(),
    surname: Joi.string().required(),
    firstname: Joi.string().required(),
    middle_name: Joi.string().optional(),
    profession: Joi.string().optional(),
    license_number: Joi.string().optional(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    user_type: Joi.string().required()
});

const rhuPool = require("../../models/rhudb");

router.get("/admin-dashboard", (req, res) => {
    res.render("admin/admin-dashboard");
});

router.get("/admin-users", (req, res) => {
    res.render("admin/admin-users");
});

router.post("/admin/create-user/submit", async (req, res) => {
    const { error, value } = userSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);
    try {
        await rhuPool.query(
            `INSERT INTO users (rhu_id, surname, firstname, middle_name, profession, license_number, username, password, user_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [value.rhu_id, value.surname, value.firstname, value.middle_name, value.profession, value.license_number, value.username, hashedPassword, value.user_type]
        );
        res.redirect("/admin-users");
    } catch (err) {
        console.error("Error: ", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/sign-in", (req, res) => {
    res.render("admin/sign-in");
})

module.exports = router;