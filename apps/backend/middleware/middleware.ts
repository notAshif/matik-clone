import type { NextFunction, Request, Response } from "express";
import { verify, type JwtPayload } from "jsonwebtoken";

export const auth = async (req: Request, res: Response, next: NextFunction) => {

    try {

        const token = req.headers.authorization;

        if (!token) {
            return res.status(403).json({
                success: false,
                message: "Not Found."
            })
        }

        const extractToken = token.split("Bearer ")[1]!

        if (!extractToken) {
            return res.status(400).json({
                success: false,
                message: "Invalid or Expire token"
            })
        }

        const decode = verify(token, import.meta.env.JWT_SECRET!) as JwtPayload

        if (!decode) {
            return res.status(400).json({
                success: false,
                message: "Invalid or Expire token"
            })
        }

        req.userId = decode.userId
        next()
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Expire or Invalid Token!"
        })
    }
}