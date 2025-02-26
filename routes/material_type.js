const express = require("express")
const router = express.Router()
const app = express()
const pool = require("../database/db")

app.use(express.json())

app.use(express.json())

// Get material types by activity id
router.get("/activity/:id", getMaterialTypesByActivityID, async (req, res) => {
    res.json(res.materialTypes)
})

// Middleware functions
async function getMaterialTypesByActivityID(req, res, next) {
    try {
        const id = req.params.id
        const materialTypes = await pool.query("SELECT * FROM material_type WHERE activity_id = ?", [id])
        if (materialTypes[0].length === 0)
            return res.status(404).json({ message: "No material types found", status: 404 })

        res.materialTypes = materialTypes[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message).error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router
