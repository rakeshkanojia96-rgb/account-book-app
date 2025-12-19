-- Add Selling Expenses to Sales
-- Track expenses specific to each sale (packing, transport, etc.)
-- Link to expense categories for proper accounting

-- Add selling expense fields to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS selling_expense_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_expense_category TEXT,
ADD COLUMN IF NOT EXISTS selling_expense_notes TEXT;

-- Comment explaining the fields
COMMENT ON COLUMN public.sales.selling_expense_amount IS 
'Direct expenses for this sale (packing, transport, etc.)';

COMMENT ON COLUMN public.sales.selling_expense_category IS 
'Category of selling expense (e.g., Packing, Transport, Commission)';

COMMENT ON COLUMN public.sales.selling_expense_notes IS 
'Notes about the selling expense';

-- Update existing rows to have 0 expense by default
UPDATE public.sales 
SET selling_expense_amount = 0 
WHERE selling_expense_amount IS NULL;

-- Create expense_categories table if not exists for reference
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_name TEXT NOT NULL,
    is_selling_expense BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own expense categories" ON public.expense_categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense categories" ON public.expense_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense categories" ON public.expense_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense categories" ON public.expense_categories
    FOR DELETE USING (auth.uid() = user_id);

-- Insert default selling expense categories
INSERT INTO public.expense_categories (user_id, category_name, is_selling_expense)
SELECT 
    u.id,
    category,
    true
FROM 
    auth.users u,
    (VALUES 
        ('Packing Material'),
        ('Packaging Cost'),
        ('Transport/Shipping'),
        ('Courier Charges'),
        ('Platform Commission'),
        ('Payment Gateway'),
        ('Marketing/Ads'),
        ('Commission'),
        ('Other Selling Expense')
    ) AS categories(category)
WHERE NOT EXISTS (
    SELECT 1 FROM public.expense_categories ec 
    WHERE ec.user_id = u.id AND ec.category_name = category
);

-- Comment
COMMENT ON TABLE public.expense_categories IS 
'Categories for expenses, including selling expenses linked to sales';
