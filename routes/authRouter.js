import express from "express";
import {
  forgetPassword,
  getUser,
  logIn,
  logOut,
  register,
  resetPassword,
  updatePassword,
  verifyOtp,
} from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", logIn);
router.get("/logout", isAuthenticated, logOut);
router.get("/me", isAuthenticated, getUser);
router.post("/password/forget", forgetPassword);
router.put("/password/reset/:token", resetPassword);
router.put("/password/update", isAuthenticated, updatePassword);

export default router;
