import { User } from "../models/userModel.js";
import { catchAsyncError } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMiddlewares.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  // console.log(token);

  if (!token) {
    return next(new ErrorHandler("User is not Authenticated.", 400));
  }
  const decoded = await jwt.verify(token, process.env.JWT_SECRET_KEY);
  // console.log(decoded);
  req.user = await User.findById(decoded.id);
  next();
});

export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `User with this role (${req.user.role}) is not allowed to acces this resource`
        )
      );
    }
    next();
  };
};
