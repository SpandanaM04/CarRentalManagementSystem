# Car & Bike Rental Management System

A full-stack learning project built with HTML, CSS, JavaScript, Node.js, Express and JSON-file persistence.

## Requirements
- Node.js LTS (18+ recommended)
- Visual Studio Code
- Internet connection for the first `npm install`

## Run in VS Code
1. Extract the ZIP.
2. Open the extracted `Car_Bike_Rental_Management_System` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:3000` in your browser.

On Windows you can also double-click `run.bat`.

## Demo accounts
- Admin email: `admin@rentalhub.com`
- Admin password: `Admin@123`
- Customer demo account: register your own account from the website.

Change the demo admin password after first login. This demo uses a local JSON file and in-memory Express sessions; it is intended for academic demonstration, not production deployment.

## Included features
- Guest vehicle browsing, contact inquiry and newsletter subscription
- Registration, login, logout, forgot/reset password
- Customer rental, rental history, profile update, password change, testimonials
- Admin dashboard and management for brands, vehicles, rentals, testimonials, contact queries, users, page content, contact details, subscribers and admin password
- JSON data is saved in `data/db.json`

## Notes
- Rental confirmation/cancellation is an admin action.
- This project demonstrates password hashing with bcryptjs and basic session authentication.
- Before production use, add CSRF protection, rate limiting, secure cookie settings behind HTTPS, stronger validation, audit logging, and a production database such as MySQL/PostgreSQL.

## Beginner code guide
Read `CODE_GUIDE.md` first. The main customer action is now labelled **Rent this vehicle**, and customer history is labelled **My Rentals**. A rental request is saved as Pending until the administrator confirms or cancels it.
