import express from 'express';
import { login, renderLogin } from '../controllers/AuthController';

const AuthRoute = express.Router();

AuthRoute.post('/login', login);
AuthRoute.get('/login', renderLogin);

export default AuthRoute;