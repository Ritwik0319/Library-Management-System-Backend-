import express from "express";
const router = express.Router();

import {
  borrowedBooks,
  recordBorrowedBook,
  getBorrowedBooksForAdmin,
  returnBorrowBook,
  getMostBorrowedBooks,
  getMostActiveMembers,
  getBookAvailabilityReport,
} from "../controllers/borrowController.js";
import {
  isAuthenticated,
  isAuthorized,
} from "../middlewares/authMiddleware.js";

router.post(
  "/record-borrow-book/:id",
  isAuthenticated,
  isAuthorized("Admin"),
  recordBorrowedBook
);
router.get(
  "/borrowed-books-by-user",
  isAuthenticated,
  isAuthorized("Admin"),
  getBorrowedBooksForAdmin
);

router.put(
  "/return-borrowed-book/:bookId",
  isAuthenticated,
  isAuthorized("Admin"),
  returnBorrowBook
);

router.get(
  "/most-borrowed-book",
  isAuthenticated,
  isAuthorized("Admin"),
  getMostBorrowedBooks
);

router.get(
  "/most-active-user",
  isAuthenticated,
  isAuthorized("Admin"),
  getMostActiveMembers
);

router.get(
  "/book-avail-report",
  isAuthenticated,
  isAuthorized("Admin"),
  getBookAvailabilityReport
);
router.get("/my-borrowed-books", isAuthenticated, borrowedBooks);
export default router;
