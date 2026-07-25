import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import postRouter from "./routes/post.routes.js";
import reelRouter from "./routes/reel.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";


const app = express();

//Middlewares

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/reels", reelRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/posts", postRouter);


app.use("/api/v1/users", userRouter);

//Test Route
app.get("/", (req, res) => {
    res.send("Hello World");
});

export { app };
