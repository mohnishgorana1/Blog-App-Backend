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

export interface IComment {
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

const CommentSchema = new Schema<IComment>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);


const BlogSchema = new Schema<IBlog>(
    {
      title: { type: String, required: true, trim: true },
      content: { type: String, required: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      category: { type: String, required: true },
      tags: { type: [String], default: [] },
      likes: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      comments: { type: [CommentSchema], default: [] },
    },
    { timestamps: true }
  );
  


export default mongoose.model<IBlog>("Blog", BlogSchema);