import express from "express";
import { getAllUsers, getById, store, update, destroy, login } from "../controllers/User";

const userRoutes = express.Router();

userRoutes.get("/", getAllUsers); // /api/users/
userRoutes.post("/", store); // /api/users/
userRoutes.put("/:id", update); // /api/users/3
userRoutes.get("/:id", getById);
userRoutes.delete("/:id", destroy);
userRoutes.post("/login", login);

export default userRoutes;
