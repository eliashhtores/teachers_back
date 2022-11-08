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

// Get one evaluation by id
router.get('/:id', getEvaluationByID, async (req, res) => {
    res.json(res.evaluation)
})

// Get evaluations by school cycle
router.get('/school_cycle/:school_cycle/:director_id', getEvaluationsBySchoolCycle, async (req, res) => {
    res.json(res.evaluations)
})

// Get school cycles
router.get('/school_cycles/get/:director_id', getSchoolCycles, async (req, res) => {
    res.json(res.evaluations)
})

// Get evaluation by teacher name
router.get('/teacher/:id', getEvaluationsByTeacherID, async (req, res) => {
    res.json(res.evaluations)
})

// Create evaluation
router.post('/', async (req, res) => {
    try {
        const {
            school_cycle,
            teacher_id,
            current_grade,
            current_letter,
            created_at,
            total_students,
            attendance,
            institution_organization,
            visit_type,
            description,
            recommendations,
            students_involved,
            students_role,
            prior_knowledge,
            prior_knowledge_form,
            situated_learning,
            activities,
            material,
            material_type,
            dead_time,
            congruent,
            promotes_situated_learning,
            feedback,
            director_id,
        } = req.body

        const newEvaluation = await pool.query(
            'INSERT INTO evaluation (school_cycle, teacher_id, current_grade, current_letter, created_at, total_students, attendance, institution_organization, visit_type, description, recommendations, students_involved, students_role, prior_knowledge, prior_knowledge_form, situated_learning, material, material_type, dead_time, congruent, promotes_situated_learning, feedback, director_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                school_cycle,
                teacher_id,
                current_grade,
                current_letter,
                created_at,
                total_students,
                attendance,
                institution_organization,
                visit_type,
                description,
                recommendations,
                students_involved,
                students_role,
                prior_knowledge,
                prior_knowledge_form,
                situated_learning,
                material,
                material_type,
                dead_time,
                congruent,
                promotes_situated_learning,
                feedback,
                director_id,
            ]
        )
        createActivity(activities, newEvaluation[0].insertId)
        res.status(201).json(newEvaluation)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Update evaluation
router.patch('/:id', async (req, res) => {
    const { id } = req.params
    const {
        name,
        school,
        grade,
        letter
    } = req.body
    try {
        const updatedEvaluation = await pool.query(
            'UPDATE evaluation SET name = ?, school = ?, grade = ?, letter = ? WHERE id = ?',
            [
                name,
                school,
                grade,
                letter,
                id,
            ]
        )
        res.json(updatedEvaluation)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Middleware functions
async function getEvaluationByID(req, res, next) {
    try {
        const { id } = req.params
        const evaluation = await pool.query('SELECT ev.*, name, school FROM evaluation ev JOIN teacher te ON (te.id = ev.teacher_id) WHERE ev.id = ?', [id])
        if (evaluation[0].length === 0) return res.status(404).json({ message: 'Evaluation not found', status: 404 })

        res.evaluation = evaluation[0][0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getEvaluationsBySchoolCycle(req, res, next) {
    try {
        const { school_cycle, director_id } = req.params
        const evaluations = await pool.query(`SELECT ev.id AS id, name AS teacher_name, created_at FROM evaluation ev JOIN teacher te ON (ev.teacher_id = te.id) WHERE school_cycle = ? AND ev.director_id = ? ORDER BY created_at ASC`, [school_cycle, director_id])
        if (evaluations[0].length === 0) return res.status(404).json({ message: 'No evaluations found', status: 404 })

        res.evaluations = evaluations[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getSchoolCycles(req, res, next) {
    const director_id = req.params.director_id
    try {
        const evaluations = await pool.query(`SELECT DISTINCT school_cycle FROM evaluation WHERE director_id = ? ORDER BY created_at DESC`, [director_id])
        if (evaluations[0].length === 0) return res.status(404).json({ message: 'No school cycles found', status: 404 })

        res.evaluations = evaluations[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getEvaluationsByTeacherID(req, res, next) {
    try {
        const { id } = req.params
        const evaluations = await pool.query(`SELECT te.name, ev.id, ev.school_cycle FROM evaluation ev JOIN teacher te ON (te.id = ev.teacher_id) WHERE teacher_id = ? ORDER BY id DESC`, [id])
        if (evaluations[0].length === 0) return res.status(404).json({ message: 'No evaluations found', status: 404 })

        res.evaluations = evaluations[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function createActivity(activities, evaluation_id) {
    for (const activity of activities) {
        if (activity == undefined)
            continue

        const {
            activity_name, start_time, linked_fields, specific_kid, group_learning, end_date, pemc, social_emotional_work,
        } = activity

        try {
            await pool.query('INSERT INTO activity (activity_name, start_time, linked_fields, specific_kid, group_learning, end_date, pemc, social_emotional_work, evaluation_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [activity_name, start_time, linked_fields, specific_kid, group_learning, end_date, pemc, social_emotional_work, evaluation_id])
        } catch (error) {
            console.error(error.message)
        }
    }
}

module.exports = router
