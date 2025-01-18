const Pool = require('pg').Pool
require('dotenv').config()

const pharmacyPool = new Pool({
    user: process.env.DB_USER2,
    host: process.env.DB_HOST2,
    database: process.env.DB_NAME2,
    password: process.env.DB_PASSWORD2,
    port: process.env.DB_PORT2,
});

module.exports = pharmacyPool