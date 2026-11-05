# Beginner Code Guide — Car/Bike Rental System

This project is split into a few files. You do not need to understand every line at once.

## Start here (recommended order)

1. `public/index.html` — the basic page shell: header, main content area, footer, and links to CSS/JavaScript.
2. `public/styles.css` — all the visual design: colours, spacing, cards, buttons, tables, and mobile layout. Change colours here.
3. `public/app.js` — browser-side actions: loads vehicle cards, opens login/register/rental forms, sends form data to the server, and updates the page.
4. `server.js` — backend: starts Node.js/Express, checks login, validates rental requests, and reads/writes saved data.
5. `data/db.json` — application data. The server creates this file on first run; do not edit it while the server is running unless you know what you are changing.
6. `package.json` — names the packages and the `npm start` command.
7. `run.bat` — Windows shortcut to start the app.

## How “Rent this vehicle” works

1. `public/app.js` shows the vehicle list loaded from `/api/vehicles`.
2. When the customer clicks **Rent this vehicle**, JavaScript opens the rental form.
3. The customer enters the start date, end date, and pickup location.
4. JavaScript sends the form to the backend endpoint `/api/rentals`.
5. `server.js` checks the request and saves a rental record in `data/db.json` with status `Pending`.
6. The customer can see the request in **My Rentals**.
7. An administrator can confirm, cancel, or complete it from the admin area.

## What the main code words mean

- **Frontend**: the page shown in the browser (`index.html`, `styles.css`, `app.js`).
- **Backend**: code that runs on Node.js (`server.js`).
- **API route**: a URL the frontend calls to ask the backend to do something, such as `/api/rentals`.
- **JSON data file**: a simple file used to save users, vehicles and rental requests instead of using MySQL.
- **Pending**: the rental request has been submitted but the administrator has not confirmed it yet.

## Run it

1. Install Node.js LTS.
2. Open this folder in VS Code.
3. Choose **Terminal → New Terminal**.
4. Run `npm install` once.
5. Run `npm start`.
6. Open `http://localhost:3000` in your browser.

Demo admin: `admin@rentalhub.com` / `Admin@123`.

## Beginner-friendly editing tips

- To change headings or visible text, start in `public/index.html` or the render functions in `public/app.js`.
- To change the appearance, edit `public/styles.css`.
- To change what happens when a form is submitted or a button is clicked, look in `public/app.js`.
- To change validation, login, saved data, or rental status rules, look in `server.js`.

This is an academic demo. Password recovery is not email/OTP verified, and a production system needs stronger security, a real database, and date-overlap availability checks.
