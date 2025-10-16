import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userModel.js";
import { Book } from "../models/bookModel.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";

export const addBook = catchAsyncError(async (req, res, next) => {
  if (!req.body) {
    return next(new ErrorHandler("Request body is missing.", 400));
  }

  const { title, author, description, publicationDate, genre, totalCopies } =
    req.body;

  if (
    !title ||
    !author ||
    !description ||
    !publicationDate ||
    !genre ||
    !totalCopies
  ) {
    return next(new ErrorHandler("All Fields are Required.", 400));
  }

  const book = await Book.create({
    title,
    author,
    description,
    publicationDate,
    genre,
    totalCopies,
  });

  return res
    .status(201)
    .json({ sucess: true, message: "Book Added Sucessfully.", book });
});

export const getAllBooks = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 10, genre, author, search } = req.query;

  // Build dynamic filter object
  const filter = {};
  if (genre) filter.genre = { $regex: genre, $options: "i" };
  if (author) filter.author = { $regex: author, $options: "i" };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
      { genre: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination logic
  const skip = (page - 1) * limit;

  const totalBooks = await Book.countDocuments(filter);
  const books = await Book.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    totalBooks,
    currentPage: Number(page),
    totalPages: Math.ceil(totalBooks / limit),
    results: books.length,
    books,
  });
});

export const deletBook = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const book = await Book.findById(id);
  if (!book) {
    return next(new ErrorHandler("Book not found.", 404));
  }

  await book.deleteOne();
  return res
    .status(200)
    .json({ sucess: true, message: "Book Deleted Sucessfully." });
});
