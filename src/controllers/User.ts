import bcrypt from "bcrypt";
import fs from "fs";
import { UploadedFile } from "express-fileupload";
import pool from "../db";
import { Request, Response } from "express";
import path from "path";
import IUser from "src/types/IUser";
import { errorResponse, successResponse } from "../helper/jsonResponse";
import jwt from "jsonwebtoken";

export async function getAllUsers(req: Request, res: Response) {
    try {
        const search = req.query.search || "";
        const client = await pool.connect();
        let result;
        if (search) result = await client.query("SELECT * FROM users WHERE name LIKE $1", [`%${search}%`]);
        else result = await client.query("SELECT * FROM users");

        console.log(result.rows);
        client.release();
        successResponse(res, result.rows, "fetched users");
    } catch (error) {
        console.error(error);
        errorResponse(error as Error, 500, "something went wrong!", res);
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

        const result = await client.query("INSERT INTO users (name, email, password, profile) VALUES ($1, $2, $3, $4) RETURNING *", [name, email, hashedPassword, fileName]);
        client.release();
        successResponse(res, result.rows, "User created successfully");
    } catch (e) {
        console.error("Error in store method:", e);
        errorResponse(e as Error, 500, "Error creating user", res);
    }
}

export async function update(req: Request, res: Response) {
    try {
        const client = await pool.connect();
        const id: number = Number(req.params.id);
        const userData: IUserWithOldPassword = req.body;
        const { name, email, password, oldPassword } = userData;

        // Retrieve old user details
        const oldUser: IUser | null = await client.query("SELECT * FROM users WHERE id = $1", [id]).then((result: any) => result.rows[0]);

        if (!oldUser) {
            throw new Error ("user not found");
        }

        // Verify old password
        const isOldPasswordValid = await bcrypt.compare(oldPassword ?? "", oldUser.password);
        if (!isOldPasswordValid) {
            return errorResponse(new Error("Old password is incorrect"), 401, "Old password is incorrect", res);
        }

        let newFileName: string | null = oldUser.profile ?? null;

        // Handle profile image update
        if (req.files?.profile) {
            const newProfile = req.files.profile as UploadedFile;
            newFileName = await storeImage(newProfile);

            // Delete old image if it exists
            if (oldUser.profile) {
                const oldImagePath = path.join(__dirname, "../../public", oldUser.profile);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        // Hash the new password
        const hashedPassword = await hashPassword(password);

        const result = await client.query("UPDATE users SET name = $1, email = $2, password = $3, profile = $4 WHERE id = $5 RETURNING *", [name, email, hashedPassword, newFileName, id]);

        client.release();
        successResponse(res, result.rows[0], "User updated successfully");
    } catch (error) {
        console.log(error)
        errorResponse(error as Error, 500, "Error updating user", res);
    }
}

export async function getById(req: Request, res: Response) {
    try {
        const client = await pool.connect();
        const id: number = Number(req.params.id);
        const result = await client.query("SELECT * FROM users WHERE id = $1", [id]);
        client.release();
        //console.log(result.rows);
        if (result.rows.length === 0) {
            throw new Error ("user not found");
        } else {
            successResponse(res, result.rows, "user found");
        }
    } catch (e) {
        console.error(e);
        errorResponse(e as Error, 404, "User not found", res);
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
            throw new Error("user not found");
            errorResponse(new Error("User not found"), 404, "User not found", res);
        } else {
            successResponse(res, [], "User deleted successfully");
        }
    } catch (e) {
        console.error(e);
        if ((e as Error).name == "not found") errorResponse(e as Error, 404, "user not found", res);
        else errorResponse(e as Error, 500, "Error deleting user", res);
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

        profile.mv(uploadPath, err => {
            if (err) {
                if (err.code === "EACCES") {
                    console.error("Permission denied while storing image:", err);
                    reject(new Error("Permission denied while storing image"));
                } else if (err.code === "ENOSPC") {
                    console.error("No space left on device to store image:", err);
                    reject(new Error("No space left on device"));
                } else {
                    console.error("Error moving file:", err);
                    reject(new Error("Failed to store image"));
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
