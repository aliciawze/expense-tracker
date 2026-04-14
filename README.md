# Expense Tracker
 
A single-page web application that helps users monitor, categorize, and visualize their personal spending.
 
## Problem Statement
 
Managing personal finances can be difficult without a clear view of where money is going. This application solves that by giving users a simple logbook to record expenses, along with an overview dashboard that breaks down spending by category and visualizes monthly trends over the last 12 months.
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Styling | Custom CSS with dark theme |
| Backend | Python (FastAPI), Node.js (static file server) |
| ORM | SQLModel |
| Database | MySQL (`mysql2/promise`) |
 
## Features
 
- Add expense items with a title, category, amount, date, and description
- Edit existing expense entries inline via a modal
- Delete expense entries from the logbook
- View all expenses in a logbook table
- Filter expenses by category
- Dashboard overview showing all-time total, current month total, and entry count
- Spending breakdown by category with amounts
- Monthly expenditure bar chart for the last 12 months
- Seamless single-page experience with no page reloads
 
## Folder Structure
 
```
EXPENSE-TRACKER/
├── public/
│   └── index.html        # Single-page frontend (HTML + CSS + JS)
├── server.js             # Express backend & API routes
├── expense_tracker.sql   # MySQL database export
├── package.json          # Node.js dependencies
├── .gitignore
└── README.md
 ```

## Challenges Overcome
 
One of the main challenges was learning about node.js and deciding my stack between using Node.js + Express or FastAPI as though in lectures and tutorials. There were also confusion for each backend technology purpose and created redundant files that were realised late into the project. It was also challenging to decide what are essential features, it took research to finalise what was essential during the timeframe of this assignment. Along with maintaining it a single-page app, without any page reload. A type mismatch between fronend and MySQL casued bugs where comparisons and calculations failed. It was solved by writing the formatExpense() helper to normalise rows before sending it to the frontend. Another challenge was accidentally forgetting .gitignore when committing to GitHub which uploaded the file node_module, taking a long time.

 
