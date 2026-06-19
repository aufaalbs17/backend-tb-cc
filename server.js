require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

let pool;
try {
    pool = mysql.createPool(dbConfig);
    console.log("Database pool created.");
} catch (err) {
    console.error("Failed to create database pool:", err.message);
}

// Helper to check DB connection
async function isDatabaseConnected() {
    if (!pool) return false;
    try {
        const connection = await pool.getConnection();
        connection.release();
        return true;
    } catch (err) {
        return false;
    }
}

// Init table if not exists (Optional but good for local testing)
async function initDB() {
    if (await isDatabaseConnected()) {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS movies (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    director VARCHAR(255) NOT NULL,
                    year INT
                )
            `);
            console.log("Table 'movies' checked/created.");
        } catch (err) {
            console.error("Error creating table:", err.message);
        }
    }
}
initDB();

const studentInfo = {
    name: process.env.STUDENT_NAME,
    nim: process.env.STUDENT_NIM
};

// 0. Endpoint / (Root) untuk test connection
app.get('/', (req, res) => {
    res.status(200).send('API is running');
});

// 1. Endpoint /health
app.get('/health', async (req, res) => {
    const dbConnected = await isDatabaseConnected();
    
    if (dbConnected) {
        res.json({
            status: "success",
            message: "Backend is running",
            database: "connected",
            student: studentInfo
        });
    } else {
        res.json({
            status: "error",
            message: "Backend is running, but database is not connected",
            database: "disconnected",
            student: studentInfo
        });
    }
});

// 2. Endpoint /schema
app.get('/schema', (req, res) => {
    res.json({
        student: studentInfo,
        resource: {
            name: "movies",
            label: "Data Film",
            description: "Aplikasi untuk mengelola data film"
        },
        fields: [
            { name: "title", label: "Judul Film", type: "text", required: true, showInTable: true },
            { name: "director", label: "Sutradara", type: "text", required: true, showInTable: true },
            { name: "year", label: "Tahun Rilis", type: "number", required: false, showInTable: true }
        ],
        endpoints: {
            list: "/movies",
            detail: "/movies/:id",
            create: "/movies",
            update: "/movies/:id",
            delete: "/movies/:id"
        }
    });
});

// 3. CRUD Endpoints for /movies

// GET Semua Data
app.get('/movies', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM movies');
        res.json({
            items: rows,
            total: rows.length
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// GET Data by ID
app.get('/movies/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM movies WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ status: "error", message: "Data not found" });
        }
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// POST Tambah Data
app.post('/movies', async (req, res) => {
    try {
        const { title, director, year } = req.body;
        const [result] = await pool.query('INSERT INTO movies (title, director, year) VALUES (?, ?, ?)', [title, director, year || null]);
        
        res.json({ id: result.insertId, title, director, year });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// PUT Ubah Data
app.put('/movies/:id', async (req, res) => {
    try {
        const { title, director, year } = req.body;
        const id = req.params.id;
        
        await pool.query('UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?', [title, director, year || null, id]);
        
        res.json({ id: parseInt(id), title, director, year });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// DELETE Hapus Data
app.delete('/movies/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM movies WHERE id = ?', [id]);
        
        res.json({
            status: "success",
            message: "Data deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend is running on http://localhost:${PORT}`);
});