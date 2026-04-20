-- Seed data for microblog
-- Run: sqlite3 microblog.db < seed_data.sql

INSERT INTO micro_posts (content, user_name) VALUES
    ('Just built my first FastAPI app — it is blazing fast!', 'alice'),
    ('ReactJS + FastAPI is the perfect stack for rapid prototypes.', 'bob'),
    ('SQLite is underrated for small to medium applications.', 'charlie'),
    ('OpenAPI auto-generated SDKs save so much time!', 'alice'),
    ('The key to clean code: separation of concerns. Always.', 'diana');

INSERT INTO likes (post_id, user_name) VALUES
    (1, 'bob'),
    (1, 'charlie'),
    (2, 'alice'),
    (3, 'alice'),
    (3, 'bob'),
    (4, 'charlie'),
    (5, 'alice'),
    (5, 'bob'),
    (5, 'charlie');
