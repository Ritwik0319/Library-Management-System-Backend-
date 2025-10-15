import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DBNAME,
    });
    console.log(`Connected to ${process.env.DBNAME} database`);
  } catch (error) {
    console.error("Error connecting to database:", error.message);
  }
};

export default connectDb;
