-- Inventory/Stock Management Schema

-- Create products/inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_name TEXT NOT NULL,
    product_code TEXT,
    category TEXT,
    unit TEXT DEFAULT 'Pieces',
    opening_stock NUMERIC DEFAULT 0,
    current_stock NUMERIC DEFAULT 0,
    minimum_stock NUMERIC DEFAULT 5,
    purchase_price NUMERIC DEFAULT 0,
    selling_price NUMERIC DEFAULT 0,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own inventory" ON public.inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory" ON public.inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory" ON public.inventory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory" ON public.inventory
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS inventory_user_id_idx ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS inventory_product_name_idx ON public.inventory(product_name);
CREATE INDEX IF NOT EXISTS inventory_current_stock_idx ON public.inventory(current_stock);

-- Stock movements/transactions table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
    movement_type TEXT NOT NULL, -- 'IN' or 'OUT' or 'ADJUSTMENT'
    quantity NUMERIC NOT NULL,
    reference_type TEXT, -- 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT'
    reference_id UUID,
    notes TEXT,
    movement_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for stock movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stock movements" ON public.stock_movements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock movements" ON public.stock_movements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for stock movements
CREATE INDEX IF NOT EXISTS stock_movements_user_id_idx ON public.stock_movements(user_id);
CREATE INDEX IF NOT EXISTS stock_movements_inventory_id_idx ON public.stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS stock_movements_date_idx ON public.stock_movements(movement_date);

-- Update trigger for inventory
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update stock on movement
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.movement_type = 'IN' THEN
        UPDATE public.inventory 
        SET current_stock = current_stock + NEW.quantity
        WHERE id = NEW.inventory_id;
    ELSIF NEW.movement_type = 'OUT' THEN
        UPDATE public.inventory 
        SET current_stock = current_stock - NEW.quantity
        WHERE id = NEW.inventory_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update inventory on stock movement
CREATE TRIGGER auto_update_stock AFTER INSERT ON public.stock_movements
    FOR EACH ROW EXECUTE FUNCTION update_inventory_stock();

-- View for low stock products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    i.*,
    (i.minimum_stock - i.current_stock) as shortage
FROM public.inventory i
WHERE i.current_stock <= i.minimum_stock;

-- View for stock value
CREATE OR REPLACE VIEW inventory_valuation AS
SELECT 
    user_id,
    SUM(current_stock * purchase_price) as total_stock_value,
    COUNT(*) as total_products
FROM public.inventory
GROUP BY user_id;
