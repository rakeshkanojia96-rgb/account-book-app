-- Migration: Add GST Percentage Field to All Tables
-- Run this in Supabase SQL Editor to add optional GST percentage

-- Add gst_percentage column to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 18;

-- Add gst_percentage column to purchases table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 18;

-- Add gst_percentage, gst_amount, and total_cost columns to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 18,
ADD COLUMN IF NOT EXISTS gst_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;

-- Update existing records to have default 18% GST if not set
UPDATE public.sales 
SET gst_percentage = 18 
WHERE gst_percentage IS NULL;

UPDATE public.purchases 
SET gst_percentage = 18 
WHERE gst_percentage IS NULL;

UPDATE public.assets 
SET gst_percentage = 18 
WHERE gst_percentage IS NULL;

-- Update existing assets to calculate total_cost if not set
UPDATE public.assets 
SET 
  gst_amount = purchase_price * (gst_percentage / 100),
  total_cost = purchase_price + (purchase_price * (gst_percentage / 100))
WHERE total_cost = 0 OR total_cost IS NULL;
