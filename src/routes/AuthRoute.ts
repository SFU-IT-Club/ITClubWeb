import express from 'express';
import { check_email, getUserProfile, login, me, register } from '../controllers/AuthController';

const AuthRoute = express.Router();

//AuthRoute.get('/me', me);
AuthRoute.post('/login', login);
AuthRoute.post('/register', register)
AuthRoute.get("/check-email", check_email);
AuthRoute.get('/me/:token',getUserProfile);

export default AuthRoute;