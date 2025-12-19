-- Add order_id to sales table
-- For tracking platform-specific order IDs (Meesho, Amazon, etc.)

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS order_id TEXT;

-- Comment explaining the field
COMMENT ON COLUMN public.sales.order_id IS 
'Platform-specific order ID (e.g., Meesho Order ID, Amazon Order ID)';
