-- Add user_id column to tasks table
-- Created: 2024-11-24

-- Add user_id column (nullable first to avoid issues with existing data)
ALTER TABLE tasks ADD COLUMN user_id UUID;

-- Add foreign key constraint
ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create index for user_id
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Create composite index for user_id and status
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- After migration, you should update existing tasks to have a user_id
-- or delete test data if in development environment

