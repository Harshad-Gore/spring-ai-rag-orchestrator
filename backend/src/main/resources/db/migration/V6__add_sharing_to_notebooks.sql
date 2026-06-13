ALTER TABLE notebooks 
ADD COLUMN share_token UUID UNIQUE,
ADD COLUMN share_type VARCHAR(50),
ADD COLUMN shared_resources VARCHAR(255);
