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
        const search = req.query.search || '';
        const client = await pool.connect();
        let result;
        if (search) result = await client.query("SELECT * FROM users WHERE name LIKE $1", [`%${search}%`]);
        else result = await client.query("SELECT * FROM users");

        console.log(result.rows);
        client.release();
        res.status(200).send(result.rows);
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
        const saltRounds = 10;
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
    const client = await pool.connect();
    try {
        const id: number = Number(req.params.id);
        
        const result = await client.query("SELECT profile FROM users WHERE id = $1", [id]);
        
        if (result.rows.length === 0) {
            const e = new Error();
            e.name = 'not found';
            e.message = 'User not found';
            throw e;
        }

        const profileFileName = result.rows[0].profile;
        
        if (profileFileName) {
            const filePath = path.join(__dirname, '../../public', profileFileName);
            
            fs.promises.access(filePath, fs.constants.F_OK)
                .then(() => {
                    fs.unlink(filePath, (e) => {
                        if (e) {
                            console.error("Error deleting profile image:", e);
                        } else {
                            console.log("Profile image deleted successfully");
                        }
                    });
                })
                .catch(() => {
                    console.log("Profile image not found, skipping deletion");
                });
        }

        // delete the user from the database
        const deleteResult = await client.query("DELETE FROM users WHERE id = $1", [id]);

        if (deleteResult.rowCount === 0) {
            const e = new Error();
            e.name = 'not found';
            e.message = 'User not found';
            throw e;
        } else {
            res.status(200).json({ message: "User deleted successfully" });
        }

    } catch (e) {
        console.error(e);
        if((e as Error).name == 'not found') res.status(404).json({ message: (e as Error).message });
        else res.status(500).json({ message: "An error occurred" });
    } finally {
        client.release();
    }
}


