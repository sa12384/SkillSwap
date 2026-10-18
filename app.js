
const express = require('express');
require('dotenv').config();

const app = express();
const pool = require('./config/db');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS
app.set('view engine', 'ejs');

// Static files
app.use(express.static('public'));

// Page routes
const pageRoutes = require('./routes/pages');
app.use('/', pageRoutes);

// Home page
app.get('/', (req, res) => {
    res.render('index');
});

const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);


const skillRoutes = require('./routes/skills');
app.use('/api/skills', skillRoutes);


const exchangeRequestRoutes = require('./routes/exchangeRequests');
app.use('/api/exchange-requests', exchangeRequestRoutes);


const studentRoutes = require('./routes/students');
app.use('/api/students', studentRoutes);

const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);


const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const sessionRoutes = require('./routes/sessions');
app.use('/api/sessions', sessionRoutes);

const reviewRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewRoutes);




app.listen(PORT, () => {
    console.log(`SkillSwap website running at http://localhost:${PORT}`);
});
