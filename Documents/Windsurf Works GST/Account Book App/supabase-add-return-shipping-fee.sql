-- Add return shipping fee to sales_returns table
-- Platforms like Meesho and Amazon charge this when customers return items

ALTER TABLE public.sales_returns 
ADD COLUMN IF NOT EXISTS return_shipping_fee NUMERIC DEFAULT 0;

-- Comment explaining the field
COMMENT ON COLUMN public.sales_returns.return_shipping_fee IS 
'Shipping fee charged by platform (Meesho/Amazon) for customer return';

-- Update existing rows to have 0 fee by default
UPDATE public.sales_returns 
SET return_shipping_fee = 0 
WHERE return_shipping_fee IS NULL;
