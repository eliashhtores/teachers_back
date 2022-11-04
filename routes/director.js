const express = require('express')
const router = express.Router()
const app = express()
const pool = require('../database/db')
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

// Get one director by id
router.get('/:id', getDirectorByID, async (req, res) => {
    res.json(res.director)
})

// Create director
router.post('/', async (req, res) => {
    try {
        const { username, name, password } = req.body
        const newDirector = await pool.query('INSERT INTO director (name, username, password) VALUES (?, ?, MD5(?))', [
            name,
            username,
            password
        ])
        res.status(201).json(newDirector)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Validate director
router.post('/validate', async (req, res) => {
    try {
        const { username, password } = req.body
        const director = await pool.query("SELECT id, name, username FROM director WHERE username = ? AND password = MD5(?)", [username, password])
        if (director[0].length == 0) {
            res.status(404).json(director[0])
            return
        }

        res.json(director[0][0])
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Middleware functions
async function getDirectorByID(req, res, next) {
    try {
        const { id } = req.params
        const director = await pool.query('SELECT * FROM director WHERE id = ?', [id])
        if (director[0].length === 0) return res.status(404).json({ message: 'director not found', status: 404 })

        res.director = director[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router
