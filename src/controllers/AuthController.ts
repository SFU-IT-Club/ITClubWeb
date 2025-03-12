import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../db";
import { errorResponse, successResponse } from "../helper/jsonResponse";
import IUser from "src/types/IUser";
import { UploadedFile } from "express-fileupload";
import { hashPassword, storeImage } from "./User";

export const renderLogin = (req: Request, res: Response): void => {
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

export async function register(req: Request, res: Response) {
    try {
        const client = await pool.connect();
        console.log('register', req.body);
        const { name, email, password }: IUser = req.body;

        let fileName: string | null = null;

        if (req.files?.profile) {
            const profile = req.files.profile as UploadedFile;
            fileName = await storeImage(profile); // Use store function
        }

        const hashedPassword = await hashPassword(password); //use hash function

        const result = await client.query("INSERT INTO users (name, email, password, profile) VALUES ($1, $2, $3, $4) RETURNING *", [name, email, hashedPassword, fileName]);
        client.release();
        successResponse(res, result.rows, "User created successfully");
    } catch (e) {
        console.error("Error in register:", e);
        errorResponse(e as Error, 500, "Error creating user", res);
    }
}

export async function check_email(req: Request, res: Response) {
    try {
        const { email } = req.query; 

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const client = await pool.connect();
        const result = await client.query(
            'SELECT COUNT(*) FROM users WHERE email = $1',
            [email]
        );

        client.release();

        if (parseInt(result.rows[0].count) > 0) {
            return res.json({ exists: true });
        }
        return res.json({ exists: false });

    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
