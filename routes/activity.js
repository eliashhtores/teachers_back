const express = require("express")
const router = express.Router()
const app = express()
const pool = require("../database/db")

app.use(express.json())

const winston = require("winston")

app.use(express.json())

const logConfiguration = {
    transports: [
        new winston.transports.File({
            filename: "logs/app.log",
        }),
    ],
}

const winstonLogger = winston.createLogger(logConfiguration)

// Get one activity by id
router.get("/:id", getActivityByID, async (req, res) => {
    res.json(res.activity)
})

// Get activity by evaluation id
router.get("/evaluation/:id", getActivitiesByEvaluationID, async (req, res) => {
    res.json(res.activities)
})

// Create activity
router.post("/", async (req, res) => {
    try {
        const { name, school, grade, letter, director_id } = req.body

        const newActivity = await pool.query(
            "INSERT INTO activity (name, school, grade, letter, director_id) VALUES (?, ?, ?, ?, ?)",
            [name, school, grade, letter, director_id]
        )
        res.status(201).json(newActivity)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Update activity
router.patch("/:id", async (req, res) => {
    const { id } = req.params
    const { name, school, grade, letter } = req.body
    try {
        const updatedActivity = await pool.query(
            "UPDATE activity SET name = ?, school = ?, grade = ?, letter = ? WHERE id = ?",
            [name, school, grade, letter, id]
        )
        res.json(updatedActivity)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Middleware functions
async function getActivityByID(req, res, next) {
    try {
        const { id } = req.params
        const activity = await pool.query("SELECT * FROM activity WHERE id = ?", [id])
        if (activity[0].length === 0) return res.status(404).json({ message: "Activity not found", status: 404 })

        res.activity = activity[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getActivitiesByEvaluationID(req, res, next) {
    try {
        const id = req.params.id
        const activities = await pool.query("SELECT * FROM activity WHERE evaluation_id = ? ORDER BY start_time ASC", [
            id,
        ])
        if (activities[0].length === 0) return res.status(404).json({ message: "No activities found", status: 404 })

        res.activities = activities[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router
