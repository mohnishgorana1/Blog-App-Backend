import User, { IUser } from "../models/user.model";
import { Blog, Comment, IBlog } from "../models/blog.model";

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export const createNewBlog = async (req: any, res: any) => {
  const { title, content, category, tags } = req.body;
  const author = req.user._id; // from authMiddleware
  console.log("create blog request", title, content, category, tags, author);

  if (!title || !content || !category || !tags || !author) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Request Data" });
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

    res.status(201).json({ success: true, blogWithAuthor: blogWithAuthor[0] }); // Return the newly created blog with author details
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getBlogDetails = async (req: any, res: any) => {
  try {
    const { blogId } = req.params;
    console.log("blog Id", blogId);

    const blog = await Blog.findById(blogId);
    if (!blog) {
      res.status(404).json({ success: false, message: "No Blog Found" });
    }

    const blogWithAuthor = await Blog.aggregate([
      { $match: { _id: blog?._id } },
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
    res.status(201).json({ success: true, blogWithAuthor: blogWithAuthor[0] }); // Return the newly created blog with author details
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBlogs = async (req: any, res: any) => {
  try {
    let { page, limit } = req.query;
    console.log("page, limit", page, limit);
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const result = await Blog.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          metadata: [{ $count: "totalBlogs" }],
          blogs: [{ $skip: skip }, { $limit: limitNumber }],
        },
      },
    ]);

    const blogs = result[0].blogs;
    const totalBlogs = result[0].metadata[0]?.totalBlogs || 0;
    const totalPages = Math.ceil(totalBlogs / limitNumber);

    res.status(200).json({
      success: true,
      page: pageNumber,
      totalPages,
      totalBlogs,
      blogs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBlog = async (req: any, res: any) => {
  const { blogId } = req.params;
  console.log("Blog Id", blogId);
  const updatedFields = req.body;
  console.log("updatedFields", updatedFields);

  // Ensure the blogId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return res.status(400).json({ success: false, message: "Invalid Blog ID" });
  }

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    // Use Aggregation Pipeline to fetch the updated blog with author details
    const blogWithAuthor = await Blog.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(blogId) } },
      {
        $lookup: {
          from: "users", // Collection name of users
          localField: "author",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      { $unwind: "$authorDetails" }, // Convert array to object
      {
        $project: {
          title: 1,
          content: 1,
          category: 1,
          tags: 1,
          likes: 1,
          views: 1,
          comments: 1,
          createdAt: 1,
          updatedAt: 1,
          // Author details
          "authorDetails.username": 1,
          "authorDetails.email": 1,
          "authorDetails.profileImage": 1,
        },
      },
    ]);

    if (!blogWithAuthor.length) {
      return res.status(404).json({ message: "Updated blog not found" });
    }

    console.log("blog with author updation", blogWithAuthor);

    res.status(200).json({
      success: true,
      message: "Blog Updated Successfully",
      blogWithAuthor: blogWithAuthor[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const addComment = async (req: any, res: any) => {
  const { blogId } = req.params;
  const { comment } = req.body;
  const userId = req.user?.id;
  console.log("Blog Id, comment, userId", blogId, comment, userId);

  // Ensure the blogId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return res.status(400).json({ success: false, message: "Invalid Blog ID" });
  }
  if (!comment) {
    return res
      .status(400)
      .json({ success: false, message: "Comment Text is required" });
  }
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User id is required" });
  }

  try {
    const blogExists = await Blog.findById(blogId);
    if (!blogExists) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const newComment = await Comment.create({
      blog: blogId,
      user: userId,
      text: comment,
      replies: [],
    });

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        $push: {
          comments: newComment._id,
        },
      },
      {
        new: true,
        upsert: false,
      }
    );
    if (!updatedBlog) {
      return res
        .status(400)
        .json({ success: false, message: "Blog not found" });
    }
    console.log("updatedBLog", updatedBlog);

    // Use Aggregation Pipeline to fetch the updated blog with author details

    const blogWithDetails = await Blog.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(String(blogId)) } },

      // populate author details
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      { $unwind: "$authorDetails" },

      // populate comments
      {
        $lookup: {
          from: "comments",
          localField: "comments",
          foreignField: "_id",
          as: "commentDetails",
        },
      },

      // Populate user details for each comment
      {
        $lookup: {
          from: "users",
          localField: "commentDetails.user",
          foreignField: "_id",
          as: "commentUsers",
        },
      },

      // Populate replies inside comments
      {
        $lookup: {
          from: "users",
          localField: "commentDetails.replies.user",
          foreignField: "_id",
          as: "replyUsers",
        },
      },

      // Map comments with user details
      {
        $addFields: {
          comments: {
            $map: {
              input: "$commentDetails",
              as: "comment",
              in: {
                _id: "$$comment._id",
                text: "$$comment.text",
                createdAt: "$$comment.createdAt",
                user: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$commentUsers",
                        as: "cu",
                        cond: { $eq: ["$$cu._id", "$$comment.user"] },
                      },
                    },
                    0,
                  ],
                },
                replies: {
                  $map: {
                    input: "$$comment.replies",
                    as: "reply",
                    in: {
                      _id: "$$reply._id",
                      text: "$$reply.text",
                      createdAt: "$$reply.createdAt",
                      user: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$replyUsers",
                              as: "ru",
                              cond: { $eq: ["$$ru._id", "$$reply.user"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      {
        $project: {
          title: 1,
          content: 1,
          category: 1,
          tags: 1,
          likes: 1,
          views: 1,
          createdAt: 1,
          updatedAt: 1,
          "authorDetails.username": 1,
          "authorDetails.email": 1,
          "authorDetails.profileImage": 1,
          comments: {
            _id: 1,
            text: 1,
            createdAt: 1,
            "user.username": 1,
            "user.email": 1,
            "user.profileImage": 1,
            replies: {
              _id: 1,
              text: 1,
              createdAt: 1,
              "user.username": 1,
              "user.email": 1,
              "user.profileImage": 1,
            },
          },
        },
      },
    ]);

    console.log("blog with details updation", blogWithDetails);

    res.status(200).json({
      success: true,
      message: "Comment Added Successfully",
      blogWithDetails: blogWithDetails[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const addReply = async (req: any, res: any) => {
  const { blogId, commentId } = req.params;
  const { reply } = req.body;
  const userId = req.user?.id;
  console.log("Comment Id, replyText, userId", commentId, reply, userId);

  // Ensure the blogId is a valid MongoDB ObjectId
  if (
    !mongoose.Types.ObjectId.isValid(blogId) ||
    !mongoose.Types.ObjectId.isValid(commentId)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Blog ID or Comment ID" });
  }
  if (!reply) {
    return res
      .status(400)
      .json({ success: false, message: "Reply Text is required" });
  }
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User id is required" });
  }

  try {
    const blogExists = await Blog.findById(blogId);
    if (!blogExists) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const commentExist = await Comment.findById(commentId);
    if (!commentExist) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: {
          replies: {
            _id: new mongoose.Types.ObjectId(),
            user: new mongoose.Types.ObjectId(String(userId)),
            text: reply,
            createdAt: new Date(),
          },
        },
      },
      {
        new: true,
        upsert: false,
      }
    );
    if (!updatedComment) {
      return res
        .status(400)
        .json({ success: false, message: "Comment not found" });
    }
    console.log("updatedComment", updatedComment);

    // Use Aggregation Pipeline to fetch the updated blog with author details

    const blogWithDetails = await Blog.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(blogId) } },

      // Populate the author details
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      { $unwind: "$authorDetails" },

      // Populate comments
      {
        $lookup: {
          from: "comments", // Reference the "comments" collection
          localField: "comments",
          foreignField: "_id",
          as: "commentsData",
        },
      },

      // Populate users in comments
      {
        $lookup: {
          from: "users",
          localField: "commentsData.user",
          foreignField: "_id",
          as: "commentUsers",
        },
      },

      // Populate replies inside comments
      {
        $lookup: {
          from: "users",
          localField: "commentsData.replies.user",
          foreignField: "_id",
          as: "replyUsers",
        },
      },

      // Structure the comments with their respective users and replies
      {
        $addFields: {
          comments: {
            $map: {
              input: "$commentsData",
              as: "comment",
              in: {
                _id: "$$comment._id",
                text: "$$comment.text",
                createdAt: "$$comment.createdAt",
                user: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$commentUsers",
                        as: "cu",
                        cond: { $eq: ["$$cu._id", "$$comment.user"] },
                      },
                    },
                    0,
                  ],
                },
                replies: {
                  $map: {
                    input: "$$comment.replies",
                    as: "reply",
                    in: {
                      _id: "$$reply._id",
                      text: "$$reply.text",
                      createdAt: "$$reply.createdAt",
                      user: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$replyUsers",
                              as: "ru",
                              cond: { $eq: ["$$ru._id", "$$reply.user"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Project only the necessary fields
      {
        $project: {
          title: 1,
          content: 1,
          category: 1,
          tags: 1,
          likes: 1,
          views: 1,
          createdAt: 1,
          updatedAt: 1,
          "authorDetails.username": 1,
          "authorDetails.email": 1,
          "authorDetails.profileImage": 1,
          comments: {
            _id: 1,
            text: 1,
            createdAt: 1,
            "user.username": 1,
            "user.email": 1,
            "user.profileImage": 1,
            replies: {
              _id: 1,
              text: 1,
              createdAt: 1,
              "user.username": 1,
              "user.email": 1,
              "user.profileImage": 1,
            },
          },
        },
      },
    ]);

    console.log("blog with details updation", blogWithDetails);

    res.status(200).json({
      success: true,
      message: "Reply Added Successfully",
      blogWithDetails: blogWithDetails[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
