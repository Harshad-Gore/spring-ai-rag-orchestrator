CREATE TABLE user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(100) NOT NULL,
    token_type VARCHAR(32) NOT NULL,
    expiry_date TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_tokens_user_id FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_tokens_token UNIQUE (token)
);

CREATE INDEX idx_user_tokens_token ON user_tokens (token);
CREATE INDEX idx_user_tokens_user_id ON user_tokens (user_id);
