import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {addComment, addReply, createNewBlog, getAllBlogs, getBlogDetails, updateBlog} from "../controllers/blogController";

const router = express.Router();

router.get("/", authenticateToken, getAllBlogs);
router.post("/new-blog", authenticateToken, createNewBlog);

router.post("/:blogId/comments/:commentId/reply", authenticateToken, addReply)
router.post("/:blogId/comments", authenticateToken, addComment)

router.patch("/:blogId", authenticateToken, updateBlog)

router.get("/:blogId", authenticateToken, getBlogDetails);


export default router;
