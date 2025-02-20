import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {createNewBlog} from "../controllers/blogController";

const router = express.Router();

router.post("/new-blog", authenticateToken, createNewBlog);

export default router;
