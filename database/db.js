const mysql = require("mysql2/promise")
if (process.env.ENV === undefined) require("dotenv").config()

let pool

try {
    pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: process.env.MYSQL_PORT,
        // debug: true,
        dateStrings: true,
    })
    ;(async () => {
        try {
            const connection = await pool.getConnection()
            console.log(`Connected to database ${process.env.MYSQL_DATABASE}`)
            connection.release()
        } catch (connectionError) {
            console.error("Failed to connect to the database:", connectionError)
            process.exit(1)
        }
    })()
} catch (error) {
    console.error("Failed to create the database pool:", error)
    process.exit(1)
}

module.exports = pool
