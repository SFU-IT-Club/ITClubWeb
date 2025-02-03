import { Response } from "express";

// Success Response Function
export function successResponse(
  res: Response,
  data: any,
  message: string = "Operation successful",
  token?: string,
  pagination?: any
) {
  const responsePayload = {
    success: true,
    data,
    msg: message,
    token: token || null,
    pagination: pagination || null,
  };

  return res.status(200).json(responsePayload);
}

// Error Response Function
export function errorResponse(
  e: Error,
  status: number,
  message: string = e.message,
  res: Response
) {
  console.error(e); 

  const responsePayload = {
    success: false,
    error: message,
    status,
  };

  return res.status(status).json(responsePayload);
}
