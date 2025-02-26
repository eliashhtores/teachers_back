const express = require("express")
const app = express()

const cors = require("cors")
const winston = require("winston")

const directorRouter = require("./routes/director")
const teacherRouter = require("./routes/teacher")
const evaluationRouter = require("./routes/evaluation")
const activityRouter = require("./routes/activity")
const linkedFieldRouter = require("./routes/linked_field")
const materialTypeRouter = require("./routes/material_type")
const reasonableAdjustmentRouter = require("./routes/reasonable_adjustment")

const logConfiguration = {
    transports: [
        new winston.transports.File({
            filename: "logs/app.log",
        }),
    ],
}

const winstonLogger = winston.createLogger(logConfiguration)

if (process.env.ENV !== "prod") {
    require("dotenv").config()

    winstonLogger.log({
        message: `Process started at ${new Date()}!`,
        level: "info",
    })
}

app.use(cors())
app.use(express.json())

app.use("/director", directorRouter)
app.use("/teacher", teacherRouter)
app.use("/evaluation", evaluationRouter)
app.use("/activity", activityRouter)
app.use("/linked_field", linkedFieldRouter)
app.use("/material_type", materialTypeRouter)
app.use("/reasonable_adjustment", reasonableAdjustmentRouter)

app.listen(process.env.PORT || 3001, () => console.log(`Server running on port ${process.env.PORT}`))

app.use((err, req, res, next) => {
    res.locals.message = err.message
    res.locals.error = process.env.ENV === "development" ? err : {}
    winstonLogger.error(err.message)

    res.status(err.status || 500)
    res.json({ error: err })
})

module.exports = app
