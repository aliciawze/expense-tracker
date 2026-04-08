from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from models import Expense
from database import create_db_and_tables, get_session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your Vite port
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# GET all expenses
@app.get("/expenses")
def get_expenses(session: Session = Depends(get_session)):
    try:
        return session.exec(select(Expense)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# POST a new expense
@app.post("/expenses")
def add_expense(expense: Expense, session: Session = Depends(get_session)):
    try:
        session.add(expense)
        session.commit()
        session.refresh(expense)
        return expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# PUT update an expense
@app.put("/expenses/{expense_id}")
def update_expense(expense_id: int, updated: Expense, session: Session = Depends(get_session)):
    try:
        expense = session.get(Expense, expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        expense.title = updated.title
        expense.amount = updated.amount
        expense.category = updated.category
        expense.expense_date = updated.expense_date
        expense.description = updated.description
        session.commit()
        session.refresh(expense)
        return expense
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# DELETE an expense
@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, session: Session = Depends(get_session)):
    try:
        expense = session.get(Expense, expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        session.delete(expense)
        session.commit()
        return {"message": "Deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))