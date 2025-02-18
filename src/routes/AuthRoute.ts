import express from 'express';
import { login } from '../controllers/AuthController';

const AuthRoute = express.Router();

AuthRoute.post('/login', login);


export default AuthRoute;