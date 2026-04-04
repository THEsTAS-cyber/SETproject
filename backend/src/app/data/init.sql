-- Database initialization script
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price FLOAT NOT NULL DEFAULT 0,
    cover_url VARCHAR(512),
    genres VARCHAR[] NOT NULL DEFAULT '{}',
    rating FLOAT,
    store_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
