import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    publicationDate: {
      type: Date,
      required: [true, "Publication date is required"],
    },
    genre: {
      type: String,
      required: [true, "Genre is required"],
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: [true, "Total number of copies is required"],
      min: [1, "A book must have at least one copy"],
    },
    availability: {
      type: Boolean,
      default: true,
    },
    borrowHistory: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        borrowDate: {
          type: Date,
          default: Date.now,
        },
        returnDate: Date,
      },
    ],
    // track total borrowed count for quick lookups
    totalBorrowedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Book = mongoose.model(process.env.BOOKCOLLECTIONNAME, bookSchema);
