📚 Library Management System (Backend)

A fully functional backend API for managing books, users, and borrowing records, built using Node.js, Express.js, and MongoDB.
This system supports admin and user operations such as adding books, borrowing, returning, and tracking borrow history.

🚀 Features
👤 User Management

User registration and login with JWT authentication

Email verification using OTP

Password reset via secure token

Role-based access (Admin / User)

📖 Book Management

Add, update, and delete books (Admin only)

Track book availability and total copies

Maintain complete borrow and return history for each book

Prevent users from borrowing the same book twice simultaneously

🔄 Borrow & Return System

Admin can record a borrowed book for any user by email

Automatically decreases available copies

Automatically updates borrow history and user records

Users can return books using email and book ID

Updates return date in both user and book records

Restores book availability when copies are returned

🧾 Borrow History

Each book stores a list of users who borrowed it with borrow and return dates

Each user keeps a record of books they borrowed (with borrow, due, and return status)

Borrow collection tracks all active and historical borrow records

📦 Installation & Setup

# Clone repository

git clone https://github.com/yourusername/library-management-system.git

# Navigate into project

cd library-management-system

# Install dependencies

npm install

# Configure environment variables

touch config/config.env

# Start the server

npm start

test the routes in Post Man

Routes:

1.register -https://library-management-system-backend-k1ho.onrender.com/api/v1/auth/register

eg:
{
"name":"ritwik",
"email":"ritwiksai1234@gmail.com",
"password":"1234567"
}

2.Verify otp-https://library-management-system-backend-k1ho.onrender.com/api/v1/auth/verify-otp
eg:
{
"email":"librarymanagements12@gmail.com",
"otp":"78725"
}

3.logIn -https://library-management-system-backend-k1ho.onrender.com/api/v1/auth/login
eg:

{
"email":"ritwiksai1234@gmail.com",
"password":"1234567"
}

4.borrow a new book -https://library-management-system-backend-k1ho.onrender.com/api/v1/borrow/record-borrow-book/68ef67164469248aa23f81ee
eg:
{
"email": "ritwiksai1234@gmail.com",
"dueDate": "2025-10-30"
}

etc...

