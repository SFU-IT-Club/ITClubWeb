import bcrypt from "bcrypt";
import fs from "fs";
import { UploadedFile } from "express-fileupload";
import  pool from "../db";
import { Request, Response } from "express";
import path from 'path';
import IUser from "src/types/IUser";
export async function getAllUsers (req : Request, res : Response) 
{
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT * FROM users");
        console.log(result.rows);
        client.release();
        res.json(result.rows);
    } catch (error) {
        console.error(error);
    }
}

export async function store (req : Request, res : Response)
{
    try {
        const client = await pool.connect();
        const { name, email, password } : IUser = req.body;
        let fileName : string | null = null;

        if(req.files?.profile) {
            const profile = req.files.profile as UploadedFile;
            fileName = Date.now().toString() + '-' + profile.name;
            profile.mv(path.join(__dirname, '../../public', fileName), (err)=>{
                console.log(err)
            });
        }
        const saltRounds = 1;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("Original Password:", password);
        console.log("Hashed Password:", hashedPassword);
        
        const result = await client.query( "INSERT INTO users (name, email, password, profile) VALUES ($1, $2, $3, $4)",  [name, email, hashedPassword, fileName] );
        client.release();

        console.log(result.rows);
        res.json(result.rows);
    } catch (e) {
        console.error("Error in store method:", e);
        res.status(500).json({ message: "An error occurred"});
    }
}

export async function update (req : Request, res : Response) {
    const id : number = Number(req.params.id);
}

export async function getById (req: Request, res : Response){
    try{
        const client = await pool.connect();
        const id: number = Number(req.params.id);
        const result = await client.query("SELECT * FROM users WHERE id = $1", [id] );
        client.release();
        console.log(result.rows);
        res.json(result.rows);
    }
    catch (e)
    {
        console.error(e);
    }
}
export async function destroy(req: Request, res: Response) {
    try {
        const client = await pool.connect();
        const id: number = Number(req.params.id);
        const result = await client.query("DELETE FROM users WHERE id = $1", [id]);

        if (result.rowCount === 0) {
            res.status(404).json({ message: "User not found" });
        } else {
            res.status(200).json({ message: "User deleted successfully" });
        }

        client.release();
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "An error occurred" });
    }
}


