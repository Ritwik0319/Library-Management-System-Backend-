import express from "express";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { addBook, deletBook, getAllBooks } from "../controllers/bookController.js";
const router = express.Router();


router.get("/all", isAuthenticated, getAllBooks);
router.post("/admin/add", isAuthenticated, isAuthorized("Admin"), addBook);
router.delete("/delete/:id", isAuthenticated, isAuthorized("Admin"), deletBook);

export default router;
