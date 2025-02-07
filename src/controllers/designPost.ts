import { generate_post_id } from "../helper/general";
import { errorResponse, successResponse } from "../helper/jsonResponse";
import { Request, Response } from "express";
import pool from "../db";

export async function createDesignPost(req: Request, res: Response) {
    try {
        const { user_id, figma_link } = req.body;
        const contributors = ["aung aung", "kyaw kyaw"];
        const post_id = generate_post_id("design");
        console.log(user_id, figma_link, contributors, post_id);
        const insertQuery = `
        INSERT INTO design_posts (post_id, user_id, figma_link, contributors, is_deleted, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;`;

        const values = [
            post_id,
            user_id,
            figma_link,
            JSON.stringify(contributors),
            false,
            new Date().toISOString(),
        ];
        const { rows } = await pool.query(insertQuery, values);
        successResponse(res, rows[0], "Design post created successfully");

    } catch (e) {
        errorResponse(e as Error, 500, "Failed to create design post", res);
    }
}


export async function getAllPosts(req: Request, res: Response) {
    try {
        const query = 'SELECT * FROM design_posts WHERE is_deleted = false ORDER BY created_at DESC';
        const { rows } = await pool.query(query);

        if (rows.length === 0) {
            return successResponse(res, [], "No posts found");
        }

        successResponse(res, rows, "Posts retrieved successfully");
    } catch (error) {
        errorResponse(error as Error, 500, "Failed to retrieve posts", res);
    }
}
export async function deletePost(req: Request, res: Response) {
    try {
        const { post_id } = req.params; // Assuming the post_id is passed in the URL

        const checkQuery = 'SELECT * FROM design_posts WHERE post_id = $1 AND is_deleted = false';
        const checkResult = await pool.query(checkQuery, [post_id]);

        if (checkResult.rows.length === 0) {
            throw new Error("Post not found or already deleted");
        }

        const updateQuery = `
            UPDATE design_posts
            SET is_deleted = true
            WHERE post_id = $1
            RETURNING *;
        `;

        const { rows } = await pool.query(updateQuery, [post_id]);

        successResponse(res, rows[0], "Design post deleted successfully");
    } catch (e) {
        errorResponse(e as Error, 500, "Failed to delete design post", res);
    }
}
export async function updatePost(req: Request, res: Response) {
    try {
        const { post_id } = req.params;
        console.log("Updating post with ID:", post_id);

        const { figma_link, contributors } = req.body;

        const checkQuery = 'SELECT * FROM design_posts WHERE post_id = $1 AND is_deleted = false';
        const checkResult = await pool.query(checkQuery, [post_id]);
        console.log(checkResult.rows);

        if (checkResult.rows.length === 0) {
            throw new Error("Post not found or already deleted");
        }

        const updateQuery = `
            UPDATE design_posts
            SET figma_link = $1, contributors = $2
            WHERE post_id = $3
            RETURNING *;
        `;
        console.log("Update query is", updateQuery);

        const values = [
            figma_link,
            JSON.stringify(contributors),
            post_id,
        ];

        const { rows } = await pool.query(updateQuery, values);

        successResponse(res, rows[0], "Design post updated successfully");
    } catch (e) {
        errorResponse(e as Error, 500, "Failed to update design post", res);
    }
}

export async function searchPosts(req: Request, res: Response) {
    try {
        const { post_id, figma_link, contributor } = req.query;

        let searchQuery = 'SELECT * FROM design_posts WHERE is_deleted = false';
        const queryParams: any[] = [];

        if (post_id) {
            queryParams.push(post_id);
            searchQuery += ` AND post_id = $${queryParams.length}`;
        }

        if (figma_link) {
            queryParams.push(`%${figma_link}%`);
            searchQuery += ` AND figma_link LIKE $${queryParams.length}`;
        }

        if (contributor) {
            queryParams.push(`%${contributor}%`);
            searchQuery += ` AND contributors::text LIKE $${queryParams.length}`;
        }

        searchQuery += ' ORDER BY created_at DESC';
        const { rows } = await pool.query(searchQuery, queryParams);

        if (rows.length === 0) {
            return successResponse(res, [], "No matching posts found");
        }

        successResponse(res, rows, "Search results retrieved successfully");
    } catch (e) {
        errorResponse(e as Error, 500, "Failed to search posts", res);
    }
}
