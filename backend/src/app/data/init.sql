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

-- Seed data: PS Store games
INSERT INTO games (title, description, price, genres, rating, store_url) VALUES
('Elden Ring', 'An epic action RPG set in the Lands Between. Explore a vast world filled with dungeons, castles, and terrifying bosses.', 39.99, ARRAY['Action', 'RPG', 'Open World'], 4.9, 'https://store.playstation.com/elden-ring'),
('God of War Ragnarök', 'Embark on an epic journey with Kratos and Atreus across the Nine Realms in search of answers.', 49.99, ARRAY['Action', 'Adventure'], 4.9, 'https://store.playstation.com/god-of-war-ragnarok'),
('Spider-Man Remastered', 'Swing through Marvel''s New York as Spider-Man in this remastered adventure.', 29.99, ARRAY['Action', 'Adventure', 'Open World'], 4.8, 'https://store.playstation.com/spider-man-remastered'),
('Cyberpunk 2077', 'An open-world RPG set in Night City — a megalopolis obsessed with power, glamour and body modification.', 19.99, ARRAY['RPG', 'Open World', 'Sci-Fi'], 4.5, 'https://store.playstation.com/cyberpunk-2077'),
('The Last of Us Part I', 'Experience the emotional story of Joel and Ellie in this stunning remake.', 49.99, ARRAY['Action', 'Adventure', 'Survival'], 4.8, 'https://store.playstation.com/last-of-us-part-i'),
('Ghost of Tsushima Director''s Cut', 'A visually stunning open-world action-adventure set in feudal Japan.', 34.99, ARRAY['Action', 'Adventure', 'Open World'], 4.7, 'https://store.playstation.com/ghost-of-tsushima'),
('Horizon Forbidden West', 'Join Aloy as she braves the Forbidden West — a majestic but dangerous frontier.', 39.99, ARRAY['Action', 'RPG', 'Open World'], 4.6, 'https://store.playstation.com/horizon-forbidden-west'),
('Resident Evil 4', 'A masterful remake of the survival horror classic.', 29.99, ARRAY['Horror', 'Action', 'Survival'], 4.7, 'https://store.playstation.com/resident-evil-4'),
('Final Fantasy XVI', 'A dark fantasy action RPG with stunning combat and an epic story.', 49.99, ARRAY['RPG', 'Action'], 4.5, 'https://store.playstation.com/final-fantasy-xvi'),
('Baldur''s Gate 3', 'An epic RPG from Larian Studios with deep choices and unforgettable characters.', 59.99, ARRAY['RPG', 'Strategy', 'Turn-Based'], 4.9, 'https://store.playstation.com/baldurs-gate-3'),
('Stardew Valley', 'A beloved farming simulator with heart, charm, and endless activities.', 14.99, ARRAY['Simulation', 'Indie', 'RPG'], 4.8, 'https://store.playstation.com/stardew-valley'),
('Hades', 'Defy the god of the dead in this roguelike dungeon crawler from Supergiant Games.', 19.99, ARRAY['Action', 'Roguelike', 'Indie'], 4.9, 'https://store.playstation.com/hades'),
('Hollow Knight', 'A beautifully crafted action-adventure through a vast ruined kingdom.', 14.99, ARRAY['Action', 'Indie', 'Platformer'], 4.8, 'https://store.playstation.com/hollow-knight'),
('It Takes Two', 'A co-op platformer about a couple on the brink of splitting up.', 29.99, ARRAY['Co-op', 'Adventure', 'Platformer'], 4.7, 'https://store.playstation.com/it-takes-two'),
('Celeste', 'Help Madeline climb a mountain in this precision platformer about self-discovery.', 9.99, ARRAY['Indie', 'Platformer'], 4.8, 'https://store.playstation.com/celeste'),
('Dead Cells', 'A fast-paced roguelike action-platformer with fluid combat.', 24.99, ARRAY['Action', 'Roguelike', 'Indie'], 4.7, 'https://store.playstation.com/dead-cells'),
('Returnal', 'A third-person shooter with roguelike elements set on a mysterious planet.', 39.99, ARRAY['Action', 'Shooter', 'Roguelike'], 4.5, 'https://store.playstation.com/returnal'),
('Persona 5 Royal', 'The definitive version of the beloved JRPG — stylish, deep, and over 100 hours long.', 29.99, ARRAY['RPG', 'JRPG', 'Turn-Based'], 4.9, 'https://store.playstation.com/persona-5-royal'),
('Gran Turismo 7', 'The ultimate driving simulator with stunning graphics and deep car customization.', 49.99, ARRAY['Racing', 'Simulation', 'Sports'], 4.4, 'https://store.playstation.com/gran-turismo-7'),
('EA Sports FC 25', 'The world''s most popular football simulation with updated rosters and gameplay.', 59.99, ARRAY['Sports', 'Simulation', 'Football'], 4.2, 'https://store.playstation.com/ea-sports-fc-25'),
('Lies of P', 'A thrilling soulslike inspired by Pinocchio, set in a dark Belle Époque world.', 34.99, ARRAY['Action', 'RPG', 'Soulslike'], 4.5, 'https://store.playstation.com/lies-of-p'),
('Astro Bot', 'A joyful and inventive platformer exclusively for PS5.', 49.99, ARRAY['Platformer', 'Adventure', 'Co-op'], 4.8, 'https://store.playstation.com/astro-bot'),
('Silent Hill 2', 'A haunting remake of the psychological horror masterpiece.', 49.99, ARRAY['Horror', 'Adventure'], 4.6, 'https://store.playstation.com/silent-hill-2'),
('Helldivers 2', 'A chaotic co-op shooter where you fight for managed democracy across the galaxy.', 39.99, ARRAY['Shooter', 'Co-op', 'Action'], 4.6, 'https://store.playstation.com/helldivers-2'),
('Metaphor: ReFantazio', 'A stunning new fantasy RPG from the creators of Persona.', 59.99, ARRAY['RPG', 'JRPG', 'Fantasy'], 4.7, 'https://store.playstation.com/metaphor-refantazio');
