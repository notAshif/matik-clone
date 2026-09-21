
import z from "zod"


export const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Password is short.")
})
export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Password is short.")
})

export const ZodErrorMessage = (({ Error }) => {
    
})