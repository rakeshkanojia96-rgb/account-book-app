-- Sales Return Reconciliation System
-- Links returns to sales via order_id and tracks claims/refunds

-- Add reconciliation fields to sales_returns table
ALTER TABLE public.sales_returns 
ADD COLUMN IF NOT EXISTS claim_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'No Claim',
ADD COLUMN IF NOT EXISTS reconciled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS net_loss NUMERIC DEFAULT 0;

-- Comments explaining the fields
COMMENT ON COLUMN public.sales_returns.claim_amount IS 
'Amount received from platform after claim approval (if wrong return)';

COMMENT ON COLUMN public.sales_returns.claim_status IS 
'Claim status: No Claim, Pending, Approved, Rejected';

COMMENT ON COLUMN public.sales_returns.reconciled IS 
'Whether this return is reconciled with original sale';

COMMENT ON COLUMN public.sales_returns.net_loss IS 
'Net profit/loss after offsetting sale and adding claim (negative = loss, positive = profit)';

-- Add order_id to sales_returns if not exists (for linking)
ALTER TABLE public.sales_returns 
ADD COLUMN IF NOT EXISTS order_id TEXT;

COMMENT ON COLUMN public.sales_returns.order_id IS 
'Links to original sale order_id for reconciliation';

-- Update existing rows
UPDATE public.sales_returns 
SET 
    claim_amount = 0,
    claim_status = 'No Claim',
    reconciled = false,
    net_loss = return_shipping_fee * -1
WHERE claim_amount IS NULL;

-- Create reconciliation view
CREATE OR REPLACE VIEW sales_return_reconciliation AS
SELECT 
    sr.id as return_id,
    sr.date as return_date,
    sr.order_id,
    sr.customer_name,
    sr.product_name,
    sr.total_amount as return_amount,
    sr.return_shipping_fee,
    sr.claim_amount,
    sr.claim_status,
    sr.refund_amount,
    s.id as original_sale_id,
    s.date as sale_date,
    s.total_amount as sale_amount,
    -- Reconciliation calculation:
    -- Net Loss = Sale Amount - Return Amount + Claim Amount - Shipping Fee
    -- If no claim: Loss = Shipping Fee
    -- If claim: Net = Claim - Shipping Fee (can be profit or loss)
    CASE 
        WHEN sr.claim_amount > 0 THEN 
            sr.claim_amount - sr.return_shipping_fee
        ELSE 
            sr.return_shipping_fee * -1
    END as net_profit_loss,
    CASE 
        WHEN sr.order_id IS NOT NULL AND s.id IS NOT NULL THEN true
        ELSE false
    END as is_reconciled
FROM public.sales_returns sr
LEFT JOIN public.sales s ON sr.order_id = s.order_id AND sr.user_id = s.user_id
ORDER BY sr.date DESC;

-- Enable RLS for the view
ALTER VIEW sales_return_reconciliation OWNER TO postgres;

-- Create function to calculate net loss
CREATE OR REPLACE FUNCTION calculate_return_net_loss()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate net profit/loss
    -- If claim approved: Net = Claim Amount - Shipping Fee
    -- If no claim: Net Loss = -Shipping Fee
    IF NEW.claim_amount > 0 THEN
        NEW.net_loss := NEW.claim_amount - NEW.return_shipping_fee;
    ELSE
        NEW.net_loss := NEW.return_shipping_fee * -1;
    END IF;
    
    -- Mark as reconciled if order_id exists
    IF NEW.order_id IS NOT NULL AND NEW.order_id != '' THEN
        NEW.reconciled := true;
    ELSE
        NEW.reconciled := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-calculation
DROP TRIGGER IF EXISTS trigger_calculate_return_net_loss ON public.sales_returns;
CREATE TRIGGER trigger_calculate_return_net_loss
    BEFORE INSERT OR UPDATE ON public.sales_returns
    FOR EACH ROW
    EXECUTE FUNCTION calculate_return_net_loss();
