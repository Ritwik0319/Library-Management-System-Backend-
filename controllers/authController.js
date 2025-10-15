import { User } from "../models/userModel.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateForgetPasswordEmailTemplate } from "../utils/emailtemplates.js";

//registation controller

export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return next(new ErrorHandler("All fields are required.", 400));
    }

    // Check if verified user already exists
    const isRegistered = await User.findOne({ email, accountverified: true });
    if (isRegistered) {
      return next(new ErrorHandler("User already exists.", 400));
    }

    // Check for excessive registration attempts (spam prevention)
    const registrationAttempts = await User.find({
      email,
      accountverified: false,
    });
    if (registrationAttempts.length >= 5) {
      return next(
        new ErrorHandler(
          "You have exceeded the number of registration attempts. Please contact support.",
          400
        )
      );
    }

    // Validate password length
    if (password.length < 8 || password.length > 16) {
      return next(
        new ErrorHandler("Password must be between 8 & 16 characters", 400)
      );
    }

    // Remove old unverified users (to avoid duplicate key error)
    await User.deleteMany({ email, accountverified: false });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate verification code and save
    const verificationCode = user.generateVerificationCode();

    await user.save();

    // Send verification email
    sendVerificationCode(verificationCode, email, res);
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Internal server error.", 500));
  }
});

export const verifyOtp = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorHandler("E-mail or OTP is missing.", 400));
  }

  try {
    const userAllentries = await User.find({
      email,
      accountverified: false,
    }).sort({ createdAt: -1 });

    if (!userAllentries || userAllentries.length === 0) {
      return next(new ErrorHandler("User not found.", 404));
    }

    let user;
    if (userAllentries.length > 1) {
      user = userAllentries[0];
      await User.deleteMany({
        _id: { $ne: user._id },
        email,
        accountverified: false,
      });
    } else {
      user = userAllentries[0];
    }

    // Compare OTP
    if (user.verificationCode !== Number(otp)) {
      return next(new ErrorHandler("Invalid OTP.", 400));
    }

    // Check expiration
    const currentTime = Date.now();
    const expiryTime = new Date(user.verificationCodeExpire).getTime();

    if (currentTime > expiryTime) {
      return next(new ErrorHandler("OTP expired.", 400));
    }

    // Mark verified and clear verification fields
    user.accountverified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save({ validateModifiedOnly: true });

    // Send JWT token
    sendToken(user, 200, "Account verified successfully.", res);
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Internal server error.", 500));
  }
});

export const logIn = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if ((!email, !password)) {
    return next(new ErrorHandler("Email or Password Fields Required.", 400));
  }
  try {
    const user = await User.findOne({ email, accountverified: true }).select(
      "+password"
    );
    if (!user) {
      return next(new ErrorHandler("InValid Email or Password.", 400));
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("InValid Email or Password.", 400));
    }

    // if user details are verified token is send
    sendToken(user, 200, "User logIn sucessfull.", res);
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("internal server error.", 500));
  }
});

export const logOut = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "logged out sucessfully",
    });
});

export const getUser = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  return res.status(200).json({
    success: true,
    user,
  });
});

export const forgetPassword = catchAsyncError(async (req, res, next) => {
  // Check request body
  if (!req.body || !req.body.email) {
    return next(new ErrorHandler("Email is required.", 400));
  }

  // Find user
  const user = await User.findOne({
    email: req.body.email,
    accountverified: true,
  });

  if (!user) {
    return next(new ErrorHandler("Invalid Email.", 400));
  }

  // Generate reset token and save user
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Construct reset link
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = generateForgetPasswordEmailTemplate(resetPasswordUrl);

  try {
    // Send email
    await sendEmail({
      email: user.email,
      subject: "Nalanda Library Management System Password Recovery",
      message,
    });

    // Success response
    return res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    // Cleanup on failure
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new ErrorHandler("Failed to send email. Try again later.", 500)
    );
  }
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  // Check request body
  if (!req.body || !req.body.password || !req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password & Confirm Password are Required.", 400)
    );
  }

  const resetPasswordToken = await crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset password token is in valid or has been expired.",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password & Confirm Password do not match.", 400)
    );
  }

  if (
    req.body.password.length < 8 ||
    req.body.password.length > 16 ||
    req.body.confirmPassword.length < 8 ||
    req.body.confirmPassword.length > 16
  ) {
    return next(
      new ErrorHandler("Password must be between 8 & 16 characters", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, "password Reset Sucessfully.", res);
});

export const updatePassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("All Filedas are required.", 400));
  }

  const isPasswordMatched = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Current Password is incorrect.", 400));
  }

  if (
    newPassword.length < 8 ||
    newPassword.length > 16 ||
    confirmNewPassword.length < 8 ||
    confirmNewPassword.length > 16
  ) {
    return next(
      new ErrorHandler("Password must be between 8 & 16 characters", 400)
    );
  }

  if (newPassword !== confirmNewPassword) {
    return next(
      new ErrorHandler("New Password & Confirm Password do not match.", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  res.status(200).json({
    success: true,
    messgae: "Password Updated.",
  });
});
