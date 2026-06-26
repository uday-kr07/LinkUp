const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

//Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

//Test Route
app.get("/", (req, res) => {
    res.send("Hello World");
});

module.exports = app;