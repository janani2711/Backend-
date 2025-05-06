import { Request, Response } from 'express';
import User, { IUser } from '../models/user';
import { handleAsync } from '../utils/error';

// Interface for the API responses
interface ApiResponse {
  success: boolean;
  data?: any;
  count?: number;
  message?: string;
}

// Get all users
export const getAllUsers = handleAsync(async (req: Request, res: Response) => {
  const users = await User.find().select('firstName lastName email role department profileImage');
  
  const response: ApiResponse = {
    success: true,
    count: users.length,
    data: users
  };
  
  res.status(200).json(response);
});

// Get single user
export const getUser = handleAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const response: ApiResponse = {
    success: true,
    data: user
  };
  
  res.status(200).json(response);
});

// Create new user
export const createUser = handleAsync(async (req: Request, res: Response) => {
  const user = await User.create(req.body);
  
  const response: ApiResponse = {
    success: true,
    data: user
  };
  
  res.status(201).json(response);
});

// Update user
export const updateUser = handleAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updated: Date.now() },
    { new: true, runValidators: true }
  );
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const response: ApiResponse = {
    success: true,
    data: user
  };
  
  res.status(200).json(response);
});

// Delete user
export const deleteUser = handleAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const response: ApiResponse = {
    success: true,
    data: {}
  };
  
  res.status(200).json(response);
});