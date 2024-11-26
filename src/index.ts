import express, { Request, Response } from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes";
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
app.use(fileUpload({
    // useTempFiles: true,
    // tempFileDir: "/tmp/",
    // limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    // createParentPath: true
}));

app.use(cookieParser()); // to parse cookies from frontend

// routes
app.use("/api/users", userRoutes);

const port : number = Number(process.env.PORT) || 8000;

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
