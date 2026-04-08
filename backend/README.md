# Expense Tracker
 
A single-page web application that helps users monitor, categorize, and visualize their personal spending.
 
## Problem Statement
 
Managing personal finances can be difficult without a clear view of where money is going. This application solves that by giving users a simple logbook to record expenses, along with an overview dashboard that breaks down spending by category and visualizes monthly trends over the last 12 months.
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Styling | Custom CSS with dark theme |
| Backend | Python (FastAPI), Node.js (static file server) |
| ORM | SQLModel |
| Database | MySQL (via PyMySQL driver) |
| Routing | FastAPI REST API endpoints |
| Deployment | Local (localhost) |
 
## Features
 
- Add expense items with a title, category, amount, date, and description
- Edit existing expense entries inline via a modal
- Delete expense entries from the logbook
- View all expenses in a sortable logbook table
- Filter expenses by category
- Dashboard overview showing all-time total, current month total, and entry count
- Spending breakdown by category with amounts
- Monthly expenditure bar chart for the last 12 months
- Seamless single-page experience with no page reloads
 
## Folder Structure
 
```
expense-tracker/
├── public/
│   └── index.html        # Single-page frontend (HTML, CSS, JavaScript)
├── backend/
│   ├── main.py           # FastAPI app and API route definitions
│   ├── database.py       # Database connection and session management
│   └── models.py         # SQLModel data models (Expense table schema)
├── server.js             # Node.js static file server for the frontend
├── package.json          # Node.js dependencies
└── README.md
```
 
## Challenges Overcome
 
One of the main challenges was designing the API to support both individual expense operations and aggregated summary data (such as category totals and monthly trends) within a single cohesive backend. Structuring the FastAPI routes cleanly while keeping the frontend fully decoupled required careful planning of the data responses. Another challenge was building the monthly bar chart purely in vanilla JavaScript without a charting library, which involved dynamically scaling bar heights relative to the maximum monthly value. Integrating FastAPI with a MySQL database using SQLModel also required resolving driver compatibility issues with PyMySQL and ensuring the database tables were correctly initialised on server startup. Finally, keeping the application behaving as a true single-page app — with all CRUD operations reflected instantly without any page reload — required disciplined use of the Fetch API and dynamic DOM manipulation throughout.
 
