const express = require("express");
const router = express.Router();
const rhuPool = require("../../models/rhudb");
const { setUserData, ensureAuthenticated, checkUserType } = require("../../middlewares/middleware");
const methodOverride = require("method-override");
const Joi = require("joi");
const bcrypt = require("bcrypt");

router.use(setUserData);
router.use(methodOverride("_method"));

const userSchema = Joi.object({
    rhu_id: Joi.number().integer().required(),
    surname: Joi.string().required(),
    firstname: Joi.string().required(),
    middle_name: Joi.string().optional(),
    profession: Joi.string().optional(),
    license_number: Joi.string().optional(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
    }),
    user_type: Joi.string().required()
});

router.use(express.json());

router.get("/sign-in", (req, res) => {
    res.render("admin/sign-in", {
        user: req.user
    });
})

router.get("/admin-dashboard", (req, res) => {
    
    res.render("admin/admin-dashboard", {
        user: req.user
    });
});

router.get("/admin-users", (req, res) => {  
    res.render("admin/admin-users", {
        user: req.user
    });
});


router.get("/api/users", async (req, res) => {
    try {
        const result = await rhuPool.query('SELECT user_type, firstname, surname, middle_name FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post("/admin/create-user/submit", async (req, res) => {
    const { error, value } = userSchema.validate(req.body);
    
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const existingUser = await rhuPool.query(
            `SELECT * FROM users WHERE username = $1`, [value.username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(value.password, 10);
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

module.exports = router;