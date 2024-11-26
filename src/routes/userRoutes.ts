import express from "express";
import { getAllUsers, store } from "../controllers/User";
const userRoutes = express.Router();    

userRoutes.get("/", getAllUsers);
userRoutes.post("/", store);
export default userRoutes;