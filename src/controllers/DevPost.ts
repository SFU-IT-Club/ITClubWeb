import bcrypt from "bcrypt";
import fs from "fs";
import pool from "../db";
import { Request, Response } from "express";
import path from "path";
import { errorResponse, successResponse } from "../helper/jsonResponse";
import { generate_post_id } from "../helper/general";

// const owner_github_username = "aung aung";
// const contributors = ["aung aung", "kyaw kyaw"];
// const branch = "master";
// const is_deleted = false;
// const contributors_json = JSON.stringify(contributors);

export async function storeDevPost(req: Request, res: Response) {
    try {
        const client = await pool.connect();
        const { title, user_id, repo_link, file_path } = req.body;

        // Generate post_id
        const post_id = generate_post_id("dev");

        // Default items
        const owner_github_username = "aung aung";
        const contributors = ["aung aung", "kyaw kyaw"];
        const branch = "master";
        const is_deleted = false;
        const contributors_json = JSON.stringify(contributors);

        // Insert into database without created_at
        const result = await client.query(
            `INSERT INTO dev_posts ( post_id, owner_github_username, repo_link, file_path, contributors, branch, title, user_id, is_deleted ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [ post_id, owner_github_username, repo_link, file_path, contributors_json, branch, title, user_id, is_deleted ]
        );

        console.log(result);
        client.release();
        successResponse(res, result.rows, "Dev post are created successfully");
    } catch (e) {
        console.error("Error in storeDevPost method:", e);
        errorResponse(e as Error, 500, "Error creating dev post", res);
    }
}
export async function updateDevPost(req: Request, res: Response) {
    try {
        const client = await pool.connect();
        const id: number = Number(req.params.id);
        if(!id) throw new Error("id must be provided, route error");

        const { title, repo_link, file_path, contributors } = req.body;

        // Retrieve old data from database
        const oldData = await client.query("SELECT * FROM dev_posts WHERE id = $1", [id]).then((result: any) => result.rows[0]);
        if (!oldData) {
            throw new Error("Cannot find dev post");
        }

        const result = await client.query(
            `UPDATE dev_posts SET  repo_link = $1, file_path = $2, contributors = $3, branch = $4, title = $5, is_deleted = $6 WHERE id = $7 
            RETURNING post_id, repo_link, file_path, contributors, branch, title, is_deleted`, 
            [
                repo_link ?? oldData.repo_link, 
                file_path ?? oldData.github_file_path, 
                JSON.stringify(contributors) ?? oldData.contributors,
                oldData.branch, 
                title ?? oldData.title, 
                oldData.is_deleted, 
                id  
            ]
        );

        client.release();
        successResponse(res, result.rows[0], "Dev post data updated successfully");
    } catch (e) {
        console.log("Error in updateDevPost method:", e);
        errorResponse(e as Error, 500, (e as Error).message, res);
    }
}

export async function getByDevPostsID(req: Request, res: Response) {
    try{
        const client = await pool.connect();
        const id: number = Number(req.params.id);
        const result = await client.query("SELECT * FROM dev_posts WHERE id = $1", [id]);
        client.release();
        if (result.rows.length === 0) {
            throw new Error ("Dev post not found");
        } else {
            successResponse(res, result.rows, "Dev post found");
        }
        
    }catch (e) {
        console.error(e);
        errorResponse(e as Error, 404, "Dev post couldnot found", res);
    }
}

export async function destroyDevPost(req: Request, res: Response) {
    const client = await pool.connect();
    try {
        const id: number = Number(req.params.id);
        console.log("id:", id);

        const result = await client.query("SELECT * FROM dev_posts WHERE id = $1", [id]);

        console.log("result:",result);
        if (result.rows.length === 0) {
            const e = new Error();  
            e.name = "not found";            
            e.message = "Dev post not found";
            throw e;
        }    

        // Delete from database
        const deleteResult = await client.query("DELETE FROM dev_posts WHERE id = $1 ", [id]);
        console.log(deleteResult);

        if (deleteResult.rowCount === 0) {
            throw new Error("Dev post is not found");
        } else {
            successResponse(res, [], "User deleted successfully");
        }
    } catch (e) {
        console.log("Error in destroyDevPost method:", e);
        errorResponse(e as Error, 404, "Dev post not found", res);
    }
    finally {
        client.release();
    }

}

export async function paginationDevPosts(req: Request, res: Response) {
    try {
        const page: number = 1; 
        const limit: number = 3;
        const skip = (page - 1) * limit;

        const total_posts_qry = 'SELECT COUNT(*) FROM dev_posts WHERE is_deleted = false';
        const total_result = await pool.query(total_posts_qry);
        const total_posts: number = parseInt(total_result.rows[0].count);
        const total_page: number = Math.ceil(total_posts / limit);

        const query = 'SELECT * FROM dev_posts WHERE is_deleted = false ORDER BY created_at LIMIT $1 OFFSET $2';
        const { rows } = await pool.query(query, [limit, skip]);

        if (rows.length === 0) {
            
            return successResponse(res, [], "No posts found");
        }

        const response = {
            current_page: page,
            total_posts,
            total_page,
            posts: rows
        };

        successResponse(res, response, "Posts retrieved successfully");
    } catch (error) {
        errorResponse(error as Error, 500, "Failed to retrieve posts", res);
    }
}

export async function getAllPosts(req: Request, res: Response) {
    try {
        const query = 'SELECT * FROM dev_posts WHERE is_deleted = false ORDER BY created_at';
        const { rows } = await pool.query(query);

        if (rows.length === 0) {
            return successResponse(res, [], "No posts found");
        }

        successResponse(res, rows, "Posts retrieved successfully");
    } catch (error) {
        errorResponse(error as Error, 500, "Failed to retrieve posts", res);
    }
}