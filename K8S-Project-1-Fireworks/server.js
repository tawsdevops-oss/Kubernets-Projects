require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

// Health check route
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fireworks_db',
    url: process.env.DATABASE_URL
};

let pool;

// Initialize Database with Retry Logic
async function initDb() {
    let connected = false;
    let retries = 15;
    while (!connected && retries > 0) {
        try {
            console.log(`Attempting to connect to database (Retries left: ${retries})...`);
            if (dbConfig.url) {
                pool = mysql.createPool(dbConfig.url);
            } else {
                const connection = await mysql.createConnection({
                    host: dbConfig.host,
                    user: dbConfig.user,
                    password: dbConfig.password
                });
                await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
                await connection.end();
                pool = mysql.createPool({
                    host: dbConfig.host,
                    user: dbConfig.user,
                    password: dbConfig.password,
                    database: dbConfig.database
                });
            }
            await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL)`);
            
            // Create a default admin user if none exists
            const [rows] = await pool.query('SELECT * FROM users');
            if (rows.length === 0) {
                await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', 'admin123']);
                console.log('Default user "admin" created.');
            }
            
            console.log(`Successfully connected to MySQL database.`);
            connected = true;
        } catch (err) {
            retries--;
            console.error(`Database connection failed: ${err.message}`);
            if (retries > 0) await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'fireworks-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!pool) return res.status(500).json({ error: 'Database not initialized' });
    try {
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
        res.status(201).json({ message: 'User created' });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!pool) return res.status(500).json({ error: 'Database not initialized' });
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            req.session.user = { id: rows[0].id, username: rows[0].username };
            res.status(200).json({ message: 'Login successful' });
        } else { 
            res.status(401).json({ error: 'Invalid username or password' }); 
        }
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initDb();
});
