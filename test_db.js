require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    console.log("Testing connection to:", process.env.DB_HOST);
    console.log("User:", process.env.DB_USER);
    console.log("DB:", process.env.DB_NAME);
    
    try {
        const pool = mysql.createPool({
            host: '34.101.233.80',
            user: 'root',
            password: 'KomputasiAwan2026!',
            connectTimeout: 5000
        });
        
        const connection = await pool.getConnection();
        console.log("Success! Connected to the database.");
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error("Connection failed:", err.message);
        process.exit(1);
    }
}

testConnection();
