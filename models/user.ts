import mongoose, { Document, Schema, Model } from 'mongoose';


export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'developer' | 'designer' | 'tester';
  department: 'engineering' | 'product' | 'design' | 'marketing' | 'sales' | 'support';
  profileImage: string;
  created: Date;
  updated: Date;
  fullName: string;
}

// Create the Schema
const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'developer', 'designer', 'tester'],
      default: 'developer',
    },
    department: {
      type: String,
      enum: ['engineering', 'product', 'design', 'marketing', 'sales', 'support'],
      default: 'engineering',
    },
    profileImage: {
      type: String,
      default: '',
    },
    created: {
      type: Date,
      default: Date.now,
    },
    updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for user's full name
UserSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('projects', {
  ref: 'Project',
  foreignField: 'assignees',
  localField: '_id',
});

// Check if model is already defined before defining it
const User: Model<IUser> = mongoose.models.User as Model<IUser> || mongoose.model<IUser>('User', UserSchema);

export default User;