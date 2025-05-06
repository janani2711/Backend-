import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect('mongodb+srv://jananiv2711:janani2711@taskmanagement.wzxzsqd.mongodb.net/?retryWrites=true&w=majority&appName=TaskManagement', {
    } as mongoose.ConnectOptions);

    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(` Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
