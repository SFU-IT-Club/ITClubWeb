import express from "express";
import {getAllUsers, getById, store, update} from "../controllers/User";
const userRoutes = express.Router();    

userRoutes.get("/", getAllUsers); // /api/users/
userRoutes.post("/", store); // /api/users/
userRoutes.put("/:id", update); // /api/users/3
userRoutes.get("/:id", getById);
export default userRoutes;