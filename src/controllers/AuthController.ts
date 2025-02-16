import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../db";
import { errorResponse, successResponse } from "../helper/jsonResponse";

export const renderLogin = (req: Request, res: Response): void => {
    const message = 'hello';
    res.render("login");
};
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new Error("email and password are required");
        }

        const client = await pool.connect();
        const result = await client.query("SELECT * FROM users WHERE email = $1", [email]);
        client.release();

        if (result.rows.length === 0) {
            throw new Error("user not found");
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error("invalid password");
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "default_secret_key", { expiresIn: "1h" });

        successResponse(res, { id: user.id, name: user.name, email: user.email }, "Login successful", token);
    } catch (error) {
        console.error("Error in login method:", error);
        errorResponse(error as Error, 500, (error as Error).message, res);
    }
}
