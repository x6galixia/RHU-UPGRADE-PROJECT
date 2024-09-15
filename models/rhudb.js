const Pool = require('pg').Pool
require('dotenv').config()

const rhuPool = new Pool({
    user: process.env.DB_USER1,
    host: process.env.DB_HOST1,
    database: process.env.DB_NAME1,
    password: process.env.DB_PASSWORD1,
    port: process.env.DB_PORT1,
});

module.exports = rhuPool