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
  const books = await Book.find();

  return res.status(200).json({ sucess: true, books });
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
