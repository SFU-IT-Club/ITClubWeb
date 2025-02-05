import express from "express";
import { storeDevPost, destroyDevPost, updateDevPost, getByDevPostsID } from "../controllers/DevPost"; 

const devPostRoutes = express.Router();


devPostRoutes.post('/store', storeDevPost);
devPostRoutes.delete('/:id', destroyDevPost);
devPostRoutes.put('/:id',updateDevPost);
devPostRoutes.get('/:id', getByDevPostsID);


export default devPostRoutes;