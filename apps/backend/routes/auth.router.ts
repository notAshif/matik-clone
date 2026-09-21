import { Router } from "express";
import { users, games, db } from "@repo/database"
import { registerSchema, loginSchema } from "@repo/common";

export const AuthRoute = Router()

AuthRoute.post("/register", (req, res) => {
    const { success, data, error } = registerSchema.safeParse(req.body);
    
})
AuthRoute.post("/login")
AuthRoute.get("/me")
