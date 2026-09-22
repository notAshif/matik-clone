import express from "express"
import cors from "cors"
import { AuthRoute } from "./routes/auth.router";

const app = express();

app.use(express.json())
app.use(cors())

app.use("/api/v1/auth", AuthRoute)

app.listen(8000, () => console.log("server running at", 8000))