const express = require("express")
const router = express.Router()
const app = express()
const pool = require("../database/db")

app.use(express.json())

app.use(express.json())

// Get linked fields by activity id
router.get("/activity/:id", getLinkedFieldsByActivityID, async (req, res) => {
    res.json(res.linkedFields)
})

// Middleware functions
async function getLinkedFieldsByActivityID(req, res, next) {
    try {
        const id = req.params.id
        const linkedFields = await pool.query("SELECT * FROM linked_field WHERE activity_id = ?", [id])
        if (linkedFields[0].length === 0)
            return res.status(404).json({ message: "No linked fields found", status: 404 })

        res.linkedFields = linkedFields[0]
        next()
    } catch (error) {
        res.status(500).json({ message: error.message, status: 500 })
        console.error(error.message).error(`${error.message} on ${new Date()}`)
    }
}

module.exports = router
