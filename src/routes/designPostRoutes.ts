import express from "express";
import { createDesignPost, getAllPosts, deletePost, updatePost} from "../controllers/designPost"; 

const designPostRoutes = express.Router();

designPostRoutes.post('/store', createDesignPost);
designPostRoutes.get('/', getAllPosts);
designPostRoutes.delete('/delete/:post_id', deletePost);
designPostRoutes.put('/update/:post_id', updatePost);

export default designPostRoutes;