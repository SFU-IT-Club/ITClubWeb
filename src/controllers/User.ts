import bcrypt from "bcrypt";
import fs from "fs";
import { UploadedFile } from "express-fileupload";
import pool from "../db";
import { Request, Response } from "express";
import path from "path";
import IUser from "src/types/IUser";
import { errorJson, successJson } from "./helper/jsonResponse";
export async function getAllUsers(req: Request, res: Response) {
    try {
        const search = req.query.search || "";
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

export async function store(req: Request, res: Response) {
    try {
        const client = await pool.connect();
        const { name, email, password }: IUser = req.body;
        let fileName: string | null = null;

        if (req.files?.profile) {
           
            const profile = req.files.profile as UploadedFile;
             //refactor
            fileName = Date.now().toString() + "-" + profile.name;
            profile.mv(path.join(__dirname, "../../public", fileName), err => {
                console.log(err);
            });
            //
        }

        //refactor
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        //

        // console.log("Original Password:", password);
        // console.log("Hashed Password:", hashedPassword);

        const result = await client.query("INSERT INTO users (name, email, password, profile) VALUES ($1, $2, $3, $4) RETURNING *", [name, email, hashedPassword, fileName]);
        client.release();

        // console.log(result.rows[0]);
        res.json(successJson("User created successfully", result.rows));
    } catch (e) {
        console.error("Error in store method:", e);
        res.status(500).json(errorJson("Error creating user", null));
    }
}

export async function update(req: Request, res: Response) {
    try {
        const client = await pool.connect();
        const id: number = Number(req.params.id);
        const { name, email, password }: IUser = req.body;

        const oldUser : IUser = await client.query("SELECT * FROM users WHERE id = $1", [id]).then((result : any) => result.rows[0]);
        console.log(oldUser);
       
        let newFileName: string | null | undefined = null;

        if (req.files?.profile) {

            const newProfile = req.files.profile as UploadedFile;
            //refactor
            newFileName = Date.now().toString() + "-" + newProfile.name;
            newProfile.mv(path.join(__dirname, "../../public", newFileName), err => {
                console.error(err);
               // throw new Error(err.message);
            });


            // delete old photo
            if(oldUser.profile)  fs.unlinkSync(path.join(__dirname, "../../public", oldUser.profile));
        }
        else {
            newFileName = oldUser.profile;
        }

        // Update the user's data
        const result = await client.query("UPDATE users SET name = $1, email = $2, password = $3, profile = $4  WHERE id = $5 RETURNING *", [name, email, password, newFileName, id]);

        client.release();
        res.json(successJson("User updated successfully", result.rows));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating user" }); // Send appropriate error response
    }
}

export async function getById(req: Request, res: Response) {
    try {
        const client = await pool.connect();
        const id: number = Number(req.params.id);
        const result = await client.query("SELECT * FROM users WHERE id = $1", [id]);
        client.release();
        //console.log(result.rows);
        if(result.rows.length === 0) {
            res.status(404).json(errorJson("User not found", null));
        }
        else {
            res.json(result.rows);
        }
    } catch (e) {
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
            e.name = "not found";
            e.message = "User not found";
            throw e;
        }

        const profileFileName = result.rows[0].profile;

        if (profileFileName) {
            const filePath = path.join(__dirname, "../../public", profileFileName);

            fs.promises
                .access(filePath, fs.constants.F_OK)
                .then(() => {
                    fs.unlink(filePath, e => {
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
        console.log(deleteResult);

        if (deleteResult.rowCount === 0) {
            res.status(404).json(errorJson("User not found", null));
        } else {
            res.status(200).json(successJson("User deleted successfully", null));
        }
    } catch (e) {
        console.error(e);
        if ((e as Error).name == "not found") res.status(404).json({ message: (e as Error).message });
        else res.status(500).json({ message: "An error occurred" });
    } finally {
        client.release();
    }
}

