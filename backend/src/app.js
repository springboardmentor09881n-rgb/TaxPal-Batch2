const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const taxEstimateRoutes = require('./routes/taxEstimateRoutes');
const taxCalendarRoutes = require('./routes/taxCalendarRoutes');
const { notFound } = require('./middleware/notFoundMiddleware');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tax-estimates', taxEstimateRoutes);
app.use('/api/tax-calendar', taxCalendarRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;