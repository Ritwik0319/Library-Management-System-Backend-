import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userModel.js";
import { Book } from "../models/bookModel.js";
import { Borrow } from "../models/borrowModel.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";

export const recordBorrowedBook = catchAsyncError(async (req, res, next) => {
  const { id: bookId } = req.params; // Book ID from URL
  const { email, dueDate: suppliedDueDate } = req.body; // Email & optional dueDate from body

  if (!email)
    return next(new ErrorHandler("User email is required.", 400));

  // Find user by email
  const user = await User.findOne({ email });
  if (!user)
    return next(new ErrorHandler("User not found with this email.", 404));

  // Find book
  const book = await Book.findById(bookId);
  if (!book)
    return next(new ErrorHandler("Book not found.", 404));

  // Check if the user already borrowed this book and hasn’t returned it yet
  const existingBorrow = await Borrow.findOne({
    userEmail: email,
    book: bookId,
    status: "borrowed",
  });

  if (existingBorrow) {
    return next(
      new ErrorHandler(
        `User "${user.name}" has already borrowed "${book.title}" and has not returned it yet.`,
        400
      )
    );
  }

  // Check availability
  if (book.totalCopies <= 0) {
    return next(
      new ErrorHandler(`No copies available for "${book.title}".`, 400)
    );
  }

  // Determine due date (provided or +7 days)
  const dueDate = suppliedDueDate
    ? new Date(suppliedDueDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create borrow record
  const borrowRecord = await Borrow.create({
    user: user._id,
    userName: user.name,
    userEmail: user.email,
    book: book._id,
    borrowDate: Date.now(),
    dueDate,
    status: "borrowed",
  });

  // Update Book document
  book.totalCopies -= 1;
  book.totalBorrowedCount = (book.totalBorrowedCount || 0) + 1;
  book.availability = book.totalCopies > 0;

  book.borrowHistory.push({
    userId: user._id,
    borrowDate: borrowRecord.borrowDate,
  });

  await book.save();

  // Update User document
  user.borrowedBooks.push({
    bookId: book._id,
    bookTitle: book.title,
    borrowDate: borrowRecord.borrowDate,
    dueDate: borrowRecord.dueDate,
    returned: false,
    borrowRecordId: borrowRecord._id,
  });

  await user.save();

  // Response
  res.status(201).json({
    success: true,
    message: `Book "${book.title}" borrowed successfully by ${user.name}.`,
    borrowRecord,
    updatedBook: {
      totalCopies: book.totalCopies,
      availability: book.availability,
      totalBorrowedCount: book.totalBorrowedCount,
    },
  });
});

export const returnBorrowBook = catchAsyncError(async (req, res, next) => {
  const { bookId } = req.params;
  const { email } = req.body;

  if (!email)
    return next(new ErrorHandler("User email is required.", 400));

  // Find the user
  const user = await User.findOne({ email });
  if (!user)
    return next(new ErrorHandler("User not found with this email.", 404));

  // Find active borrow record
  const borrowRecord = await Borrow.findOne({
    userEmail: email,
    book: bookId,
    status: "borrowed",
  });

  if (!borrowRecord)
    return next(
      new ErrorHandler("No active borrow record found for this user and book.", 404)
    );

  // Mark borrow record as returned
  borrowRecord.returnDate = Date.now();
  borrowRecord.status = "returned";
  await borrowRecord.save();

  // Update Book
  const book = await Book.findById(bookId);
  if (book) {
    book.totalCopies += 1;
    book.availability = book.totalCopies > 0;

    // Update borrow history return date
    const history = book.borrowHistory.find(
      (b) =>
        b.userId.toString() === user._id.toString() && !b.returnDate
    );

    if (history) history.returnDate = borrowRecord.returnDate;
    await book.save();
  }

  // Update User’s borrowedBooks entry
  const borrowedBook = user.borrowedBooks.find(
    (b) => b.bookId.toString() === book._id.toString() && b.returned === false
  );

  if (borrowedBook) borrowedBook.returned = true;
  await user.save();

  // Response
  res.status(200).json({
    success: true,
    message: `Book "${book?.title}" returned successfully by ${user.name}.`,
    updatedBook: {
      totalCopies: book?.totalCopies,
      availability: book?.availability,
    },
  });
});


// Admin: View all borrowed books
export const getBorrowedBooksForAdmin = catchAsyncError(
  async (req, res, next) => {
    const borrowRecords = await Borrow.find()
      .populate("user", "name email role")
      .populate("book", "title author genre totalCopies availability")
      .sort({ createdAt: -1 });

    if (!borrowRecords.length)
      return next(new ErrorHandler("No borrowed books found.", 404));

    res.status(200).json({
      success: true,
      count: borrowRecords.length,
      borrowRecords,
    });
  }
);

// User: View my borrowed books
export const borrowedBooks = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;

  const userBorrowedBooks = await Borrow.find({ user: userId })
    .populate("book", "title author genre publicationDate")
    .sort({ createdAt: -1 });

  if (!userBorrowedBooks.length)
    return next(new ErrorHandler("You have not borrowed any books yet.", 404));

  res.status(200).json({
    success: true,
    count: userBorrowedBooks.length,
    borrowedBooks: userBorrowedBooks,
  });
});
