-- Add file_data column to contracts table for storing original files as base64
-- Run this in your Supabase SQL editor

ALTER TABLE contracts 
ADD COLUMN file_data TEXT;