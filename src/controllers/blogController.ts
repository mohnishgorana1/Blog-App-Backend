import User, { IUser } from "../models/user.model";
import Blog, { IBlog } from "../models/blog.model";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const createNewBlog = async (req: any, res: any) => {
  const { title, content, category, tags } = req.body;
  const author = req.user._id; // from authMiddleware
  console.log("create blog request", title, content, category, tags, author);

  if (!title || !content || !category || !tags || !author) {
    return res.status(400).json({ message: "Invalid Request Data" });
  }

  try {
    const newBlog = await Blog.create({
      title,
      content,
      author,
      category,
      tags,
    });

    const blogWithAuthor = await Blog.aggregate([
      { $match: { _id: newBlog._id } },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      {
        $unwind: "$authorDetails",
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          category: 1,
          tags: 1,
          createdAt: 1,
          "authorDetails._id": 1,
          "authorDetails.username": 1,
          "authorDetails.email": 1,
        },
      },
    ]);
    console.log("blogWithAuthor", blogWithAuthor);
    

    res.status(201).json(blogWithAuthor[0]); // Return the newly created blog with author details
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
