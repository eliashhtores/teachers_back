const express = require('express')
const router = express.Router()
const app = express()
const pool = require('../database/db')

app.use(express.json())

const winston = require('winston')

app.use(express.json())

const logConfiguration = {
    'transports': [
        new winston.transports.File({
            filename: 'logs/app.log'
        })
    ]
}

const winstonLogger = winston.createLogger(logConfiguration)

// Get one teacher by id
router.get('/:id', getTeacherByID, async (req, res) => {
    res.json(res.teacher)
})

// Get teacher by name
router.get('/teacher/:name', getTeachersByName, async (req, res) => {
    res.json(res.teachers)
})

// Create teacher
router.post('/', async (req, res) => {
    try {
        const {
            name,
            school,
            grade,
            letter,
            director_id,
        } = req.body

        const newTeacher = await pool.query(
            'INSERT INTO teacher (name, school, grade, letter, director_id) VALUES (?, ?, ?, ?, ?)',
            [
                name,
                school,
                grade,
                letter,
                director_id,
            ]
        )
        res.status(201).json(newTeacher)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Update teacher
router.patch('/:id', async (req, res) => {
    const { id } = req.params
    const {
        name,
        school,
        grade,
        letter
    } = req.body
    try {
        const updatedTeacher = await pool.query(
            'UPDATE teacher SET name = ?, school = ?, grade = ?, letter = ? WHERE id = ?',
            [
                name,
                school,
                grade,
                letter,
                id,
            ]
        )
        res.json(updatedTeacher)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Middleware functions
async function getTeacherByID(req, res, next) {
    try {
        const { id } = req.params
        const teacher = await pool.query('SELECT * FROM teacher WHERE id = ?', [id])
        if (teacher[0].length === 0) return res.status(404).json({ message: 'Teacher not found', status: 404 })

        res.teacher = teacher[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getTeachersByName(req, res, next) {
    try {
        const { name } = req.params
        const teachers = await pool.query(`SELECT * FROM teacher WHERE name LIKE '%${name}%'`)
        if (teachers[0].length === 0) return res.status(404).json({ message: 'No teachers found', status: 404 })

        res.teachers = teachers[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router
