
import z, { ZodError } from "zod"


export const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Password is short.")
})
export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Password is short.")
})

export const ZodErrorMessage = (({ error }: {error: ZodError}) => {
    return error.issues.map((er) => `path:${er.input}, message:${er.message}`).join(",")
})