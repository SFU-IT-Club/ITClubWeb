import express from 'express';
import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../helper/jsonResponse';
import { GithubRepoType } from 'src/types/IGithub';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const Github_Token = process.env.GITHUB_TOKEN;

const GitHubApiRequestHelper = express.Router();

GitHubApiRequestHelper.get('/getgithubrepoinfo', async (req: Request, res: Response): Promise<void> => {
    try {
        const {repoUrl} = req.query;
        if(!repoUrl || typeof repoUrl !== 'string') 
        {
            throw new Error("missing or invalid repoUrl");
        }
        const urlMatch = repoUrl?.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)/);

        if(!urlMatch)
        {
            throw new Error("invalid github repo url");
        }

        const [_, owner, repo] = urlMatch;

        const headers = {
            Authorization: `Bearer ${Github_Token}`
        };

        const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;

        const repoResponse : any = await axios.get(repoApiUrl, { headers });

        const contributorsApiUrl = `https://api.github.com/repos/${owner}/${repo}/contributors`;

        const contributorsResponse : any  = await axios.get(contributorsApiUrl, {
            headers
        });

        const repoInfo: GithubRepoType = {
            name: repoResponse.data.name,
            default_branch: repoResponse.data.default_branch,
            owner: repoResponse.data.owner.login,
            contributors: contributorsResponse.data.map((contributor: any) => contributor?.login || ""),
            url: repoApiUrl,
            created_at: repoResponse.data.created_at
        };

        successResponse(res, repoInfo, "Success");
    }
    catch(error)
    {
        errorResponse(error as Error, 400, "Bad Request", res);
    }
});

export default GitHubApiRequestHelper;