const express = require("express")
const router = express.Router()
const app = express()
const pool = require("../database/db")

app.use(express.json())

// Get one teacher by id
router.get("/:id/:director_id", getTeacherByID, async (req, res) => {
    res.json(res.teacher)
})

// Get teachers by name
router.get("/teacher/:name/:director_id", getTeachersByName, async (req, res) => {
    res.json(res.teachers)
})

// Create teacher
router.post("/", async (req, res) => {
    try {
        const { name, grade, letter, director_id } = req.body

        const newTeacher = await pool.query(
            "INSERT INTO teacher (name, school, grade, letter, director_id) VALUES (?, (SELECT school FROM director WHERE id = ?), ?, ?, ?)",
            [name, director_id, grade, letter, director_id]
        )
        res.status(201).json(newTeacher)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message).error(`${error.message} on ${new Date()}`)
    }
})

// Update teacher
router.patch("/:id", async (req, res) => {
    const { id } = req.params
    const { name, grade, letter } = req.body
    try {
        const updatedTeacher = await pool.query("UPDATE teacher SET name = ?, grade = ?, letter = ? WHERE id = ?", [
            name,
            grade,
            letter,
            id,
        ])
        res.json(updatedTeacher)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message).error(`${error.message} on ${new Date()}`)
    }
})

// Middleware functions
async function getTeacherByID(req, res, next) {
    try {
        const { id, director_id } = req.params
        const teacher = await pool.query(
            `
        SELECT te.*, ev.total_students FROM teacher te
        LEFT JOIN evaluation ev ON (ev.teacher_id = te.id)
        WHERE te.id = ? 
            AND te.director_id = ?
        ORDER BY ev.created_at DESC
        LIMIT 1
        `,
            [id, director_id]
        )
        if (teacher[0].length === 0) return res.status(404).json({ message: "Teacher not found", status: 404 })

        res.teacher = teacher[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message).error(`${error.message} on ${new Date()}`)
    }
}

async function getTeachersByName(req, res, next) {
    try {
        const { name, director_id } = req.params
        let query = `SELECT * FROM teacher WHERE name LIKE '%${name}%' AND director_id = ?`

        if (name === "allTeachers") query = `SELECT * FROM teacher WHERE director_id = ?`

        const teachers = await pool.query(`${query}`, [director_id])
        if (teachers[0].length === 0) return res.status(404).json({ message: "No teachers found", status: 404 })

        res.teachers = teachers[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message).error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router
