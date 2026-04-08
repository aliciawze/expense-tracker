from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date

class Expense(SQLModel, table=True):
    __tablename__ = "expenses"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    amount: float
    category: Optional[str] = Field(default=None)
    expense_date: Optional[date] = Field(default=None)
    description: Optional[str] = Field(default=None)