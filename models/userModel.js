import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config({ path: "./config/config.env" });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    accountverified: {
      type: Boolean,
      default: false,
    },
    borrowedBooks: [
      {
        // store the Book id (so front-end can easily populate book info)
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
          required: true,
        },
        returned: {
          type: Boolean,
          default: false,
        },
        bookTitle: String,
        borrowDate: Date,
        dueDate: Date,
        // optional: store the borrow record id as well if you want
        borrowRecordId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Borrow",
        },
      },
    ],
    avatar: {
      public_id: String,
      url: String,
    },
    verificationCode: Number,
    verificationCodeExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Generate OTP code method
userSchema.methods.generateVerificationCode = function () {
  const generateFiveDigitNumber = function () {
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    const remainingDigits = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    return parseInt(firstDigit + remainingDigits);
  };

  const verificationCode = generateFiveDigitNumber();
  this.verificationCode = verificationCode;
  this.verificationCodeExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  return verificationCode;
};

// Generate JWT token method
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken;
};

export const User = mongoose.model(process.env.USERCOLLECTIONNAME, userSchema);
