const mysql = require('mysql2/promise')
require('dotenv').config()

console.log(process.env.ENV)

try {
    const pool = mysql.createPool({
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_NAME,
        port: process.env.DATABASE_PORT,
        // debug: true,
        dateStrings: true,
    })
    console.log(`Connected to database ${process.env.DATABASE_NAME}...`)
    module.exports = pool
} catch (error) {
    console.error(error)
}
