-- Create initial admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (email, password_hash, role, is_active)
VALUES (
    'admin@example.com',
    '$2a$10$YourBcryptHashHere', -- This needs to be generated
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;
