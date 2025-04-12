import express from "express";
import { storeDevPost, destroyDevPost, updateDevPost, getByDevPostsID, paginationDevPosts, getAllPosts } from "../controllers/DevPost"; 

const devPostRoutes = express.Router();

devPostRoutes.get('/', getAllPosts); // api/dev-posts
devPostRoutes.get('/pagination',paginationDevPosts);
devPostRoutes.post('/store', storeDevPost);
devPostRoutes.delete('/:id', destroyDevPost);
devPostRoutes.put('/:id',updateDevPost);
devPostRoutes.get('/:id', getByDevPostsID);

export default devPostRoutes;