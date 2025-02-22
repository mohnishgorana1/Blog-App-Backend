import mongoose, { Document, Schema } from "mongoose";

export interface IBlog extends Document {
  title: string;
  content: string;
  author: mongoose.Schema.Types.ObjectId;
  category: string;
  tags: string[];
  likes: number;
  views: number;
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment extends Document {
  blog: mongoose.Schema.Types.ObjectId;
  user: mongoose.Schema.Types.ObjectId;
  text: string;
  replies: IReply[];
  createdAt: Date;
}

export interface IReply {
  user: mongoose.Schema.Types.ObjectId;
  text: string;
  createdAt: Date;
}

const ReplySchema = new Schema<IReply>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true } // Ensures replies have unique IDs
);

const CommentSchema = new Schema<IComment>(
  {
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    replies: [ReplySchema], // Replies inside comment
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // Now referencing Comment model
  },
  { timestamps: true }
);

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);
export const Blog = mongoose.model<IBlog>("Blog", BlogSchema);
