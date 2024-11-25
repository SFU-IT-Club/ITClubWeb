import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pool from "./db";
require("dotenv/config");

const app = express();
app.use(express.json()); // { "name": "John" } { name : "John" } // to parse json data
app.use(express.urlencoded({ extended: true })); // to parse url encoded data

app.use(
    cors({
        origin: "http://localhost:3000", // frontend origin
        credentials: true,
    })
); // to allow cross origin data

app.use(cookieParser()); // to parse cookies from frontend

// routes
app.get("/", async (req : Request, res : Response) => {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT * FROM users");
        console.log(result.rows);
        client.release();
        res.json(result.rows);
    } catch (error) {
        console.error(error);
    }
});

const port : number = Number(process.env.PORT) || 8000;

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
