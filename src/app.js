import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
//some configuratoin 

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())



//routes import 

import userRouter from './routes/user.routes.js'

//routes declaration - controller k liye middleware lana hoga bcz seprate h
app.use("/api/v1/users",userRouter)

app.use((error, req, res, next) => {
    console.error("Request failed:", error)

    const statusCode = Number.isInteger(error?.statusCode)
        ? error.statusCode
        : Number.isInteger(error?.status) ? error.status : 500
    const message = typeof error?.message === "string"
        ? error.message
        : "Internal server error"

    res.status(statusCode).json({
        success: false,
        message,
    })
})

export {app}
