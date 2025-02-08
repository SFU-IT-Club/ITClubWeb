import express, { Request, Response } from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes";
import designPostRoutes from "./routes/designPostRoutes";
import devPostRoutes from "./routes/devPostRoutes";
require("dotenv/config");

const app = express();
app.use(express.json()); // { "name": "John" } { name : "John" } // to parse json data
app.use(express.urlencoded({ extended: true })); // to parse url encoded data
console.log('hello world');
app.use(
    cors({
        origin: "http://localhost:3000", // frontend origin
        credentials: true,
    })
); // to allow cross origin data
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    createParentPath: true
}));

app.use(cookieParser()); // to parse cookies from frontend

// routes
app.use("/api/users", userRoutes);
app.use("/api/design-Posts", designPostRoutes);
app.use("/api/dev-posts", devPostRoutes);


const port : number = Number(process.env.PORT) || 8000;

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
