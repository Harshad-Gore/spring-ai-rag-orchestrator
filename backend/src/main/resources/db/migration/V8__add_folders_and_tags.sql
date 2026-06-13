-- V8__add_folders_and_tags.sql

CREATE TABLE notebook_folders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notebook_folders_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    color_hex VARCHAR(7) NOT NULL DEFAULT '#657069',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tags_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE TABLE notebook_tags (
    notebook_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    PRIMARY KEY (notebook_id, tag_id),
    CONSTRAINT fk_notebook_tags_notebook FOREIGN KEY (notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE,
    CONSTRAINT fk_notebook_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

ALTER TABLE notebooks ADD COLUMN folder_id UUID;
ALTER TABLE notebooks ADD CONSTRAINT fk_notebooks_folder FOREIGN KEY (folder_id) REFERENCES notebook_folders(id) ON DELETE SET NULL;
