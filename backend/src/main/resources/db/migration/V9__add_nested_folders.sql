-- V9__add_nested_folders.sql

-- 1. Add parent_id to notebook_folders
ALTER TABLE notebook_folders ADD COLUMN parent_id UUID;
ALTER TABLE notebook_folders ADD CONSTRAINT fk_notebook_folders_parent FOREIGN KEY (parent_id) REFERENCES notebook_folders(id) ON DELETE CASCADE;

-- 2. Drop existing constraint on notebooks
ALTER TABLE notebooks DROP CONSTRAINT fk_notebooks_folder;

-- 3. Re-add constraint with CASCADE
ALTER TABLE notebooks ADD CONSTRAINT fk_notebooks_folder FOREIGN KEY (folder_id) REFERENCES notebook_folders(id) ON DELETE CASCADE;
