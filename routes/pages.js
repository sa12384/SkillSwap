
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');


router.get('/', (req, res) => {
    res.render('index');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

router.get('/admin-dashboard', (req, res) => {
    res.render('admin-dashboard');
});

router.get('/profile', (req, res) => {
    res.render('profile');
});

router.get('/skills', (req, res) => {
    res.render('skills');
});

router.get('/find-students', (req, res) => {
    res.render('find-students');
});

router.get('/requests', (req, res) => {
    res.render('requests');
});

router.get('/test-session', (req, res) => {
    res.render('test-session');
});

router.get('/calendar', (req, res) => {
    res.render('calendar');
});

router.get('/reviews', (req, res) => {
    res.render('reviews');
});


router.get('/schedule-session', (req, res) => {
    res.render('scheduleSession');
});

router.get('/sessions', (req, res) => {
    res.render('mySessions');
});


router.get('/terms', (req, res) => {
    res.render('terms');
});

module.exports = router;
