import User, { IUser } from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateTokens = (user: IUser) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  user.refreshToken = refreshToken;
  user.save();

  return { refreshToken, accessToken };
};

export const registerUser = async (req: any, res: any) => {
  const { username, email, password } = req.body;
  //   console.log("Register request", username, password, email);

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Invalid Request Data" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const newUser = new User({
      username,
      email,
      password,
      role: "user", // Default role
    });

    await newUser.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);
    // console.log("NEW USER", newUser, accessToken, refreshToken);

    // Send response with tokens
    res.status(201).json({ accessToken, refreshToken });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
export const loginUser = async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Invalid Request Data" });
  }
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Compare the password
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Send response with tokens
    res.status(200).json({ accessToken, refreshToken });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get authenticated user details
export const getUserDetails = async (req: any, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};
