import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../db";
import { errorResponse, successResponse } from "../helper/jsonResponse";
import IUser from "src/types/IUser";
import { UploadedFile } from "express-fileupload";
import { hashPassword, storeImage } from "./User";
import 'dotenv/config';

export const renderLogin = (req: Request, res: Response): void => {
    res.render("login");
};

export async function me (req: Request, res: Response) {
    console.log('token', req.cookies.token);
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
        const token = set_token(user.id, res);

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

        const hashedPassword = await hashPassword(password); // Use hash function

        const result = await client.query(
            "INSERT INTO users (name, email, password, profile) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, hashedPassword, fileName]
        );

        client.release();
        if (result.rows.length === 0) {
            throw new Error("User registration failed");
        }
      

        const user = result.rows[0];
        const token = set_token(user.id, res);
       
    
        successResponse(res, { id: user.id, name: user.name, email: user.email }, 'User created successfully', token);
    } catch (e) {
        console.error("Error in register:", e);
        errorResponse(e as Error, 500, "Error creating user", res);
    }
}

export async function checkEmail(req: Request, res: Response) {
    try {
        const { email } = req.query; 

        if (!email) {
            throw new Error("email is required");
        }

        const client = await pool.connect();
        const result = await client.query(
            'SELECT COUNT(*) FROM users WHERE email = $1',
            [email]
        );

        client.release();

        if (parseInt(result.rows[0].count) > 0) {
            successResponse(res, { exists : true }, "email already exists");
        } else {
            successResponse(res, { exists : false }, "email does not exist");
        }
    } catch (error) {
        console.error('Error checking email:', error);
        errorResponse(error as Error, 404, "error in check email", res);
    }
}

export async function getUserProfile(req: Request, res: Response) 
{
    try {
        const client = await pool.connect();
        const { token } = req.params;
        
        const decoded_token = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
        const userId = decoded_token?.id as number;
        
        const result = await client.query("SELECT * FROM users WHERE id = $1", [userId]);
        client.release();
        successResponse(res, result.rows, "User profile fetched successfully");
    } catch (error) {
        console.error("Error in getUserProfile:", error);
        errorResponse(error as Error, 500, "Error fetching user profile", res);
    }
}

function get_token(id : any) {
    if(!process.env.JWT_SECRET && typeof process.env.JWT_SECRET !== 'string') throw new Error("invalid JWT secret key");
    const token = jwt.sign({ id }, process.env.JWT_SECRET);
    return token;
}

function set_token(id : any, res : Response) {
    const token = get_token(id);
    const maxAgeForCookie = 3 * 24 * 60 * 60 * 1000; // 3 days in mili-seconds
    res.cookie('token', token, { httpOnly : true, maxAge : maxAgeForCookie, secure : true, sameSite : 'none' , partitioned : true });
    return token;
}