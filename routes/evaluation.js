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

// Get one evaluation by id
router.get("/:id", getEvaluationByID, async (req, res) => {
    res.json(res.evaluation)
})

// Get evaluations by school cycle
router.get("/school_cycle/:school_cycle/:director_id", getEvaluationsBySchoolCycle, async (req, res) => {
    res.json(res.evaluations)
})

// Get school cycles
router.get("/school_cycles/get/:director_id", getSchoolCycles, async (req, res) => {
    res.json(res.evaluations)
})

// Get evaluation by teacher id
router.get("/teacher/:id", getEvaluationsByTeacherID, async (req, res) => {
    res.json(res.evaluations)
})

// Check evaluation by current date
router.get("/teacher/check/:name/:director_id", checkCurrentDayEvaluation, async (req, res) => {
    res.json(res.evaluations)
})

// Get evaluations by date and teacher name
router.get("/teacher/:name/:date/:director_id", getEvaluationsByDateAndName, async (req, res) => {
    res.json(res.evaluations)
})

// Get dead times by evaluation id
router.get("/dead_time/:id", getDeadTimes, async (req, res) => {
    res.json(res.deadTimes)
})

// Get evaluation data for teacher charting purposes
router.get("/:teacher_id/:chart/:date/:director_id", getEvaluationData, async (req, res) => {
    res.json(res.evaluations)
})

// Get evaluation data for teacher charting purposes
router.get("/:chart/:school_cycle/:director_id", getGlobalEvaluationData, async (req, res) => {
    res.json(res.evaluations)
})

// Create evaluation
router.post("/", async (req, res) => {
    try {
        const {
            school_cycle,
            teacher_id,
            current_grade,
            current_letter,
            total_students,
            attendance,
            institution_organization,
            visit_type,
            congruent,
            promotes_situated_learning,
            feedback,
            director_id,
            activities,
            deadTimes,
        } = req.body

        const newEvaluation = await pool.query(
            "INSERT INTO evaluation (school_cycle, teacher_id, current_grade, current_letter, total_students, attendance, institution_organization, visit_type, congruent, promotes_situated_learning, feedback, director_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                school_cycle,
                teacher_id,
                current_grade,
                current_letter,
                total_students,
                attendance,
                institution_organization,
                visit_type,
                congruent,
                promotes_situated_learning,
                feedback,
                director_id,
            ]
        )
        createActivities(activities, newEvaluation[0].insertId)
        createDeadTimes(deadTimes, newEvaluation[0].insertId)
        res.status(201).json(newEvaluation)
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
})

// Update evaluation
router.patch("/:id", async (req, res) => {
    const { id } = req.params
    const { name, school, grade, letter } = req.body
    try {
        const updatedEvaluation = await pool.query(
            "UPDATE evaluation SET name = ?, school = ?, grade = ?, letter = ? WHERE id = ?",
            [name, school, grade, letter, id]
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
        const evaluation = await pool.query(
            "SELECT ev.*, name, school FROM evaluation ev JOIN teacher te ON (te.id = ev.teacher_id) WHERE ev.id = ?",
            [id]
        )
        if (evaluation[0].length === 0) return res.status(404).json({ message: "Evaluation not found", status: 404 })

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
        const evaluations = await pool.query(
            `SELECT ev.id AS id, name AS teacher_name, created_at FROM evaluation ev JOIN teacher te ON (ev.teacher_id = te.id) WHERE school_cycle = ? AND ev.director_id = ? ORDER BY created_at ASC`,
            [school_cycle, director_id]
        )
        if (evaluations[0].length === 0) return res.status(404).json({ message: "No evaluations found", status: 404 })

        res.evaluations = evaluations[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getDeadTimes(req, res, next) {
    try {
        const { id } = req.params
        const deadTimes = await pool.query("SELECT * FROM dead_time WHERE evaluation_id = ?", [id])
        if (deadTimes[0].length === 0) return res.status(404).json({ message: "No dead times found", status: 404 })

        res.deadTimes = deadTimes[0]
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
        const evaluations = await pool.query(
            `SELECT ev.id AS id, name AS teacher_name, created_at FROM evaluation ev JOIN teacher te ON (ev.teacher_id = te.id) WHERE school_cycle = ? AND ev.director_id = ? ORDER BY created_at ASC`,
            [school_cycle, director_id]
        )
        if (evaluations[0].length === 0) return res.status(404).json({ message: "No evaluations found", status: 404 })

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
        const evaluations = await pool.query(
            `SELECT DISTINCT school_cycle FROM evaluation WHERE director_id = ? ORDER BY created_at DESC`,
            [director_id]
        )
        if (evaluations[0].length === 0) return res.status(404).json({ message: "No school cycles found", status: 404 })

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
        const evaluations = await pool.query(
            "SELECT DISTINCT DATE(ev.created_at) AS created_at, ev.school_cycle, ev.id FROM evaluation ev JOIN teacher te ON (te.id = ev.teacher_id) WHERE teacher_id = ? ORDER BY ev.created_at DESC",
            [id]
        )
        if (evaluations[0].length === 0) return res.status(404).json({ message: "No evaluations found", status: 404 })

        res.evaluations = evaluations[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function checkCurrentDayEvaluation(req, res, next) {
    try {
        const { name, director_id } = req.params
        const evaluations = await pool.query(
            `
        SELECT te.id, te.name, DATE(MAX(ev.created_at)) AS created_at
        FROM teacher te 
        LEFT JOIN evaluation ev ON (te.director_id = ev.director_id AND ev.teacher_id = te.id) 
        WHERE te.director_id = ?
            AND te.name LIKE '%${name}%'
        GROUP BY te.id
        ORDER BY te.name ASC
        `,
            [director_id]
        )
        if (evaluations[0].length === 0) return res.status(404).json({ message: "No evaluations found", status: 404 })
        res.evaluations = evaluations[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getEvaluationsByDateAndName(req, res, next) {
    try {
        const { name, date, director_id } = req.params
        const evaluations = await pool.query(
            `
        SELECT te.id, te.name, DATE(MAX(ev.created_at)) AS created_at
        FROM teacher te 
        LEFT JOIN evaluation ev ON (te.director_id = ev.director_id AND ev.teacher_id = te.id) 
        WHERE te.director_id = ?
            AND te.name LIKE '%${name}%'
            AND DATE(created_at) = ?
        GROUP BY te.id
        ORDER BY te.name ASC
        `,
            [director_id, date]
        )
        if (evaluations[0].length === 0) return res.status(404).json({ message: "No evaluations found", status: 404 })
        res.evaluations = evaluations[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getEvaluationData(req, res, next) {
    try {
        const { teacher_id, chart, date, director_id } = req.params
        let query = `
            SELECT TRUNCATE(SUM(TIME_TO_SEC(TIMEDIFF(end, start)) / 60), 0) AS total
                FROM dead_time dt
                JOIN evaluation ev ON (ev.id = dt.evaluation_id) 
                WHERE ev.teacher_id = ?
                    AND DATE(created_at) = ?
            `
        if (chart === "students") {
            query = `
                SELECT
                    COUNT(students_involved) AS 'total',
                    COALESCE(SUM(students_involved = 'Todos'), 0) AS 'all',
                    COALESCE(SUM(students_involved = 'Más de la mitad'), 0) AS 'more_than_half',
                    COALESCE(SUM(students_involved = 'La mitad'), 0) AS 'half',
                    COALESCE(SUM(students_involved = 'Menos de la mitad'), 0) AS 'less_than_half',
                    COALESCE(SUM(students_involved = 'Ninguno'), 0) AS 'none'
                    FROM activity ac 
                    JOIN evaluation ev ON (ev.id = ac.evaluation_id)
                    WHERE teacher_id = ?
                        AND DATE(ev.created_at) = ?
                        AND ev.director_id = ?
                `
        } else if (chart === "material") {
            query = `
                SELECT
                    COUNT(mt.material) AS 'total', 
                    COALESCE(SUM(mt.material = 'Permanente de trabajo'), 0) AS 'permanent',
                    COALESCE(SUM(mt.material = 'Informativo'), 0) AS 'informative',
                    COALESCE(SUM(mt.material = 'Ilustrativo'), 0) AS 'illustrative',
                    COALESCE(SUM(mt.material = 'Audiovisual'), 0) AS 'audiovisual',
                    COALESCE(SUM(mt.material = 'Experimental'), 0) AS 'experimental',
                    COALESCE(SUM(mt.material = 'Tecnológico'), 0) AS 'technological'
                    FROM material_type mt
                    LEFT JOIN activity ac ON (ac.id = mt.activity_id)
                    LEFT JOIN evaluation ev ON (ev.id = ac.evaluation_id)
                    WHERE ev.teacher_id = ?
                    AND DATE(ev.created_at) = ?
                    AND ev.director_id = ?
                `
        }
        const evaluations = await pool.query(query, [teacher_id, date, director_id])
        if (evaluations[0].length === 0) return res.status(404).json({ message: "No evaluations found", status: 404 })
        res.evaluations = evaluations[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function getGlobalEvaluationData(req, res, next) {
    try {
        const { chart, school_cycle, director_id } = req.params
        let query = `
        SELECT 
        (SELECT COUNT(DISTINCT evaluation_id) 
            FROM dead_time 
            WHERE evaluation_id IN (SELECT id FROM evaluation 
                                        WHERE director_id = ? AND school_cycle = ?)) AS count,
        (SELECT COUNT(*) FROM teacher 
            WHERE director_id = ?) AS total;
        `
        if (chart === "global_students") {
            query = `
                SELECT
                    COUNT(students_involved) AS 'total',
                    COALESCE(SUM(students_involved = 'Todos'), 0) AS 'all',
                    COALESCE(SUM(students_involved = 'Más de la mitad'), 0) AS 'more_than_half',
                    COALESCE(SUM(students_involved = 'La mitad'), 0) AS 'half',
                    COALESCE(SUM(students_involved = 'Menos de la mitad'), 0) AS 'less_than_half',
                    COALESCE(SUM(students_involved = 'Ninguno'), 0) AS 'none'
                    FROM activity ac 
                    JOIN evaluation ev ON (ev.id = ac.evaluation_id)
                    WHERE school_cycle = ?
                        AND director_id = ?
        `
        } else if (chart === "global_material") {
            query = `
                SELECT
                    COUNT(mt.material) AS 'total', 
                    COALESCE(SUM(mt.material = 'Permanente de trabajo'), 0) AS 'permanent',
                    COALESCE(SUM(mt.material = 'Informativo'), 0) AS 'informative',
                    COALESCE(SUM(mt.material = 'Ilustrativo'), 0) AS 'illustrative',
                    COALESCE(SUM(mt.material = 'Audiovisual'), 0) AS 'audiovisual',
                    COALESCE(SUM(mt.material = 'Experimental'), 0) AS 'experimental',
                    COALESCE(SUM(mt.material = 'Tecnológico'), 0) AS 'technological'
                    FROM material_type mt
                    LEFT JOIN activity ac ON (ac.id = mt.activity_id)
                    LEFT JOIN evaluation ev ON (ev.id = ac.evaluation_id)
                    WHERE school_cycle = ?
                        AND director_id = ?
                `
        } else if (chart === "pemc") {
            query = `
                SELECT
                COUNT(students_involved) AS 'total',
                COALESCE(SUM(pemc = 'Sí'), 0) AS 'yes',
                COALESCE(SUM(pemc = 'No'), 0) AS 'no'
                FROM activity ac 
                JOIN evaluation ev ON (ev.id = ac.evaluation_id)
                WHERE school_cycle = ?
                    AND director_id = ?
                `
        }

        let params = [school_cycle, director_id]
        if (chart === "global_time") params = [director_id, school_cycle, director_id]

        const evaluations = await pool.query(query, params)

        if (evaluations[0].length === 0) return res.status(404).json({ message: "No evaluations found", status: 404 })
        res.evaluations = evaluations[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message)
        winstonLogger.error(`${error.message} on ${new Date()}`)
    }
}

async function createActivities(activities, evaluation_id) {
    for (const activity of activities) {
        if (activity == undefined) continue

        const {
            activity_name,
            description,
            start_time,
            linked_fields,
            end_time,
            pemc,
            social_emotional_work,
            students_involved,
            students_role,
            prior_knowledge,
            material,
            recommendations,
            material_type,
            reasonable_adjustments,
        } = activity

        try {
            const newActivity = await pool.query(
                "INSERT INTO activity (activity_name, description, start_time, end_time, pemc, social_emotional_work, students_involved, students_role, prior_knowledge, material, recommendations, evaluation_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    activity_name,
                    description,
                    start_time,
                    end_time,
                    pemc,
                    social_emotional_work,
                    students_involved,
                    students_role,
                    prior_knowledge,
                    material,
                    recommendations,
                    evaluation_id,
                ]
            )
            createLinkedFields(linked_fields, newActivity[0].insertId)

            if (reasonable_adjustments.length !== 0)
                createReasonableAdjustments(reasonable_adjustments, newActivity[0].insertId)

            if (material === "Con material") createMaterials(material_type, newActivity[0].insertId)
        } catch (error) {
            console.error(error.message)
        }
    }
}

async function createDeadTimes(deadTimes, evaluation_id) {
    for (const deadTime of deadTimes) {
        if (deadTime == undefined) continue

        const { start, end, docent_activity } = deadTime

        try {
            await pool.query("INSERT INTO dead_time (start, end, docent_activity, evaluation_id) VALUES (?, ?, ?, ?)", [
                start,
                end,
                docent_activity,
                evaluation_id,
            ])
        } catch (error) {
            console.error(error.message)
        }
    }
}

async function createLinkedFields(linked_fields, activity_id) {
    const linkedFieldsArray = linked_fields.split("\n")

    linkedFieldsArray.forEach(async function (field) {
        try {
            await pool.query("INSERT INTO linked_field (field, activity_id) VALUES (?, ?)", [field, activity_id])
        } catch (error) {
            console.error(error.message)
        }
    })
}

async function createMaterials(material_types, activity_id) {
    const materialsArray = material_types.split("\n")

    materialsArray.forEach(async function (material) {
        try {
            await pool.query("INSERT INTO material_type (material, activity_id) VALUES (?, ?)", [material, activity_id])
        } catch (error) {
            console.error(error.message)
        }
    })
}

async function createReasonableAdjustments(reasonable_adjustments, activity_id) {
    const reasonableAdjustmentsArray = reasonable_adjustments.split("\n")

    for (let i = 0; i < reasonableAdjustmentsArray.length; i++) {
        try {
            await pool.query("INSERT INTO reasonable_adjustment (kid, adjustment, activity_id) VALUES (?, ?, ?)", [
                reasonableAdjustmentsArray[i],
                reasonableAdjustmentsArray[i + 1],
                activity_id,
            ])
        } catch (error) {
            console.error(error.message)
        }
        i++
    }
}

module.exports = router
