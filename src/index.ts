import express, { Request, Response } from "express";
import { engine } from "express-handlebars";
import cors from "cors";
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes";
import designPostRoutes from "./routes/designPostRoutes";
import devPostRoutes from "./routes/devPostRoutes";
import path from 'path';
import AuthRoute from "./routes/AuthRoute";
import GitHubApiRequestHelper from "./ApiRequest/GitHubApiRequest";
require("dotenv/config");

const app = express();

app.use(express.json()); // { "name": "John" } { name : "John" } // to parse json data
app.use(express.urlencoded({ extended: true })); // to parse url encoded data


// view engine setup
app.engine(".hbs", engine(
    {
        extname: ".hbs",
        defaultLayout: false,

    }
));
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, 'views', "public"))); // to serve static files

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
app.get("/", (req: Request, res: Response) => {
    res.render('home', {
        title: 'My Handlebars App'
    });
});

app.get("/login", (req: Request, res: Response) => {
    res.render('login', {
        title: 'Login Page',
        error: req.query.errorResponse,
    });
});
app.get("/register", (req: Request, res: Response) => {
    res.render('register', {
        title: 'Register Page',
        error: req.query.errorResponse,
    });
});

app.get("/users", (req: Request, res: Response) => {
    res.render('users', {
        title: 'All Users',
        error: req.query.errorResponse,
    });
});


app.get("/develop-form", (req: Request, res: Response) => {
    res.render('dev-form', {
        title: 'dev-form',
    })
});

app.get("/design-posts", (req: Request, res: Response) => {
    res.render('designPost', {
        title: 'Design Posts Page',

        error: req.query.errorResponse,
    });
});


app.use("/api/users", userRoutes);
app.use("/api/design-Posts", designPostRoutes);
app.use("/api/dev-posts", devPostRoutes);
app.use("/api/auth", AuthRoute);
app.use("/api/githubrequest", GitHubApiRequestHelper);

const port: number = Number(process.env.PORT) || 8000;

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
