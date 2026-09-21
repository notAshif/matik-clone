import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/schemas/schema.ts'
})
