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
        const result = await client.query("INSERT INTO users (name, email, password, profile) VALUES ($1, $2, $3, $4)", [name, email, password, fileName]);
        client.release();
        console.log(result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
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


