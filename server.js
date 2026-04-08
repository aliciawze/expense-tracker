const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'chocoW33',
  database: 'expense_tracker',
  waitForConnections: true,
  connectionLimit: 10,
});

function formatExpense(row) {
  return {
    ...row,
    amount: Number(row.amount),
    expense_date: row.expense_date
      ? new Date(row.expense_date).toISOString().slice(0, 10)
      : null,
  };
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC, id DESC');
    res.json(rows.map(formatExpense));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST create expense
app.post('/api/expenses', async (req, res) => {
  const { title, category, amount, expense_date, description } = req.body;
  if (!title || !category || !amount || !expense_date) {
    return res.status(400).json({ error: 'title, category, amount, and expense_date are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO expenses (title, category, amount, expense_date, description) VALUES (?, ?, ?, ?, ?)',
      [title, category, Number(amount), expense_date, description || '']
    );
    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json(formatExpense(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT update expense
app.put('/api/expenses/:id', async (req, res) => {
  const { title, category, amount, expense_date, description } = req.body;
  if (!title || !category || !amount || !expense_date) {
    return res.status(400).json({ error: 'title, category, amount, and expense_date are required' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE expenses SET title = ?, category = ?, amount = ?, expense_date = ?, description = ? WHERE id = ?',
      [title, category, Number(amount), expense_date, description || '', req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    res.json(formatExpense(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Expense Tracker running at http://localhost:${PORT}`);
});