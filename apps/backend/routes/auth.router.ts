import { Router } from "express";
import { users, games, db, eq } from "@repo/database";
import { registerSchema, loginSchema, ZodErrorMessage } from "@repo/common";
import { compare, hash } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { auth } from "../middleware/middleware";

export const AuthRoute = Router();
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (typeof import.meta !== "undefined" && import.meta.env?.JWT_SECRET) ||
  "fdsjhkhjshsgfhgfjshgfjhdfg";

AuthRoute.post("/register", async (req, res) => {
    try {
        const { success, data, error } = registerSchema.safeParse(req.body);

        if (!success) {
            return res.status(403).json({ message: ZodErrorMessage({ error }) });
        }

        const { email, password }: any = data;

        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "user already exist.",
            });
        }

        const username = email.split("@")[0]!;
        const PasswordHash = await hash(password, 12);

        const [newUser] = await db
            .insert(users)
            .values({
                username: username,
                email: email,
                password: PasswordHash,
            })
            .returning({
                id: users.id,
                email: users.email,
                username: users.username,
                createdAt: users.createdAt,
            });

        return res.status(200).json({
            success: true,
            message: "Registration Successful.",
            data: { newUser },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
});

AuthRoute.post("/login", async (req, res) => {
    try {
        const { success, data, error } = loginSchema.safeParse(req.body);

        if (!success) {
            return res.status(403).json({ message: ZodErrorMessage({ error }) });
        }

        const { email, password }: any = data;

        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "user not found",
            });
        }

        const isValidPassword = await compare(password, existingUser.password);

        if (!isValidPassword) {
            return res.status(403).json({
                success: false,
                message: "Invalid Password",
            });
        }

        const token = sign({ userId: existingUser.id }, JWT_SECRET!, { expiresIn: "7d" });

        return res.status(200).json({
            success: true,
            message: "Login Successful.",
            data: {
                token,
            },
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
});


AuthRoute.get("/me", auth, async (req, res) => {
    try {

        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, Number(userId)),
            columns: {
                password: false
            },
            with: {
                ratings: true,
                gameMembers: {
                    with: {
                        game: true
                    }
                }
            }
        })

        return res.status(200).json({
            success: true,
            message: "User Found.",
            data: {
                user
            }
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error
        })
    }
});
