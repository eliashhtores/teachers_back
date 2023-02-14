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

// Get reasonable adjustments by activity id
router.get('/activity/:id', getReasonableAdjustmentsByActivityID, async (req, res) => {
    res.json(res.reasonableAdjustments)
})


// Middleware functions
async function getReasonableAdjustmentsByActivityID(req, res, next) {
    try {
        const id = req.params.id
        const reasonableAdjustments = await pool.query('SELECT * FROM reasonable_adjustment WHERE activity_id = ?', [id])
        if (reasonableAdjustments[0].length === 0) return res.status(404).json({ message: 'No reasonable adjustments found', status: 404 })

        res.reasonableAdjustments = reasonableAdjustments[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router
