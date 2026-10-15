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
import healthcheckerRouter from './routes/healthcheck.route.js'
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from './routes/subscription.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from "./routes/comment.routes.js"
import likeRouter from './routes/like.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import playlistRouter from "./routes/playlist.routes.js"


//routes declaration - controller k liye middleware lana hoga bcz seprate h
app.use("/api/v1/users",userRouter)
app.use("/api/v1/healthcheck",healthcheckerRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/like",likeRouter)
app.use("/api/v1/dashboard",dashboardRouter)
app.use("/api/v1/playlist",playlistRouter)


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
