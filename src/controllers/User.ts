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
            fileName = await storeImage(profile); // Use store function
        }

        const hashedPassword = await hashPassword(password); //use hash function

        const result = await client.query(
            "INSERT INTO users (name, email, password, profile) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, hashedPassword, fileName]
        );
        client.release();

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

        const userData: IUserWithOldPassword = req.body;
        const { name, email, password, oldPassword } = userData;

        // retrieve old user details
        const oldUser: IUser | null = await client.query("SELECT * FROM users WHERE id = $1", [id]).then((result: any) => result.rows[0]);
        if (!oldUser) {
            res.status(404).json(errorJson("User not found", null));
            return;
        }

        let newFileName: string | null = oldUser.profile ?? null;

        if (req.files?.profile) {
            const newProfile = req.files.profile as UploadedFile;
            newFileName = await storeImage(newProfile); // Use store function

            // Delete old image
            if (oldUser.profile) {
                const oldImagePath = path.join(__dirname, "../../public", oldUser.profile);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        // Verify old password or comparing password
        const isOldPasswordValid = await bcrypt.compare(oldPassword ?? "", oldUser.password);
        if (!isOldPasswordValid) {
            res.status(400).json(errorJson("Old password doesn't match", null));
            return;
        }

        // Hash the new password
        const hashedPassword = await hashPassword(password);

        const result = await client.query(
            "UPDATE users SET name = $1, email = $2, password = $3, profile = $4 WHERE id = $5 RETURNING *",
            [name, email, hashedPassword, newFileName, id]
        );

        client.release();
        res.json(successJson("User updated successfully", result.rows));
    } catch (error) {
        // console.error("Error updating user:", error);
        res.status(500).json(errorJson("Error updating user", null));
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
        else res.status(500).json(errorJson("Error Occurred", null));
    } finally {
        client.release();
    }
}



// Hash function
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}


// store image
export async function storeImage(profile: UploadedFile): Promise<string> {
    return new Promise((resolve, reject) => {
        const fileName = Date.now().toString() + "-" + profile.name;
        const uploadPath = path.join(__dirname, "../../public", fileName);

        profile.mv(uploadPath, (err) => {
            if (err) {
                if (err.code === 'EACCES') {
                    console.error('Permission denied while storing image:', err);
                    reject(new Error('Permission denied while storing image'));
                } else if (err.code === 'ENOSPC') {
                    console.error('No space left on device to store image:', err);
                    reject(new Error('No space left on device'));
                } else {
                    console.error('Error moving file:', err);
                    reject(new Error('Failed to store image'));
                }
            } else {
                resolve(fileName);
            }
        });
    });
}

interface IUserWithOldPassword extends IUser {
    oldPassword?: string;
}



