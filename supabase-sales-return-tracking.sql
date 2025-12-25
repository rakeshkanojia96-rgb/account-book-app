-- Sales Return Tracking & Inventory Reconciliation
-- Adds fields to track if a sale has been returned

-- Add return tracking columns to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS is_returned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS return_id INTEGER;

-- Comments explaining the fields
COMMENT ON COLUMN public.sales.is_returned IS 
'Flag indicating if this sale has been returned';

COMMENT ON COLUMN public.sales.return_id IS 
'Reference to the sales_return record (if returned)';

-- Add foreign key constraint (optional, for data integrity)
-- This creates a relationship between sales and sales_returns
ALTER TABLE public.sales
ADD CONSTRAINT fk_sales_return
FOREIGN KEY (return_id) 
REFERENCES public.sales_returns(id)
ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sales_is_returned 
ON public.sales(is_returned);

CREATE INDEX IF NOT EXISTS idx_sales_return_id 
ON public.sales(return_id);

-- View to see sales with their return status
CREATE OR REPLACE VIEW sales_with_returns AS
SELECT 
    s.*,
    sr.claim_status,
    sr.claim_amount,
    sr.return_shipping_fee,
    sr.net_loss,
    CASE 
        WHEN s.is_returned THEN 'Returned'
        ELSE 'Active'
    END as sale_status
FROM public.sales s
LEFT JOIN public.sales_returns sr ON s.return_id = sr.id;

-- Grant permissions
GRANT SELECT ON sales_with_returns TO authenticated;
