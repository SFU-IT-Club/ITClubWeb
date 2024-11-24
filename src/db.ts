const { Pool } = require('pg');
require('dotenv').config();

// Create a pool instance with Neon credentials
const pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: { rejectUnauthorized: false }, // SSL required for Neon
});

// Test the connection
(async () => {
    try {
        const client = await pool.connect();
        console.log('Connected to Neon PostgreSQL');
        client.release();
    } catch (err) {
        console.error('Connection error:', (err as Error).message);
    }
})();

export default pool;