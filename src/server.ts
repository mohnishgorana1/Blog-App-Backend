import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import connectDB from "./config/db";
import userRoutes from './routes/user.routes'
import blogRoutes from './routes/blog.routes'
dotenv.config();

const app = express();

// middlewares
app.use(express.json()); // parse json bodies
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(cors()); // enable cors
app.use(helmet()); // Secure headers
app.use(morgan("dev")); // Log requests
app.use(compression()); // Enable compression





// Routes 
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/blog", blogRoutes)

// test route
app.get("/", (req: Request, res: Response) => {
  res.send("Advncd BLOG API Running");
});


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log("Server running at PORT ", PORT);
})

// Connect to MongoDB
connectDB();