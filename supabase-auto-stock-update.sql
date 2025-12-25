-- Auto Stock Update on Sales
-- This will automatically reduce stock when a sale is made

-- Function to update inventory stock on sale
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    inventory_record RECORD;
BEGIN
    -- Find matching product in inventory by exact product name match
    SELECT * INTO inventory_record
    FROM public.inventory
    WHERE user_id = NEW.user_id 
    AND LOWER(TRIM(product_name)) = LOWER(TRIM(NEW.product_name))
    LIMIT 1;
    
    IF FOUND THEN
        -- Reduce stock by sale quantity
        IF TG_OP = 'INSERT' THEN
            -- New sale - reduce stock
            UPDATE public.inventory
            SET current_stock = current_stock - NEW.quantity
            WHERE id = inventory_record.id;
            
            -- Log stock movement
            INSERT INTO public.stock_movements (
                user_id,
                inventory_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                movement_date,
                notes
            ) VALUES (
                NEW.user_id,
                inventory_record.id,
                'OUT',
                NEW.quantity,
                'SALE',
                NEW.id,
                NEW.date,
                'Auto-deducted from sale: ' || NEW.invoice_number
            );
            
        ELSIF TG_OP = 'UPDATE' THEN
            -- Sale updated - adjust stock difference
            DECLARE
                qty_difference NUMERIC;
            BEGIN
                qty_difference = NEW.quantity - OLD.quantity;
                
                IF qty_difference != 0 THEN
                    UPDATE public.inventory
                    SET current_stock = current_stock - qty_difference
                    WHERE id = inventory_record.id;
                    
                    -- Log the adjustment
                    INSERT INTO public.stock_movements (
                        user_id,
                        inventory_id,
                        movement_type,
                        quantity,
                        reference_type,
                        reference_id,
                        movement_date,
                        notes
                    ) VALUES (
                        NEW.user_id,
                        inventory_record.id,
                        CASE WHEN qty_difference > 0 THEN 'OUT' ELSE 'IN' END,
                        ABS(qty_difference),
                        'SALE',
                        NEW.id,
                        NEW.date,
                        'Sale quantity updated'
                    );
                END IF;
            END;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- Sale deleted - restore stock
            UPDATE public.inventory
            SET current_stock = current_stock + OLD.quantity
            WHERE id = inventory_record.id;
            
            -- Log stock return
            INSERT INTO public.stock_movements (
                user_id,
                inventory_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                movement_date,
                notes
            ) VALUES (
                OLD.user_id,
                inventory_record.id,
                'IN',
                OLD.quantity,
                'SALE',
                OLD.id,
                OLD.date,
                'Sale deleted - stock restored'
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto stock update on sales
DROP TRIGGER IF EXISTS auto_stock_update_on_sale ON public.sales;
CREATE TRIGGER auto_stock_update_on_sale
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_sale();

-- Function to update inventory stock on purchase
CREATE OR REPLACE FUNCTION update_inventory_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
    inventory_record RECORD;
BEGIN
    -- Find matching product in inventory by exact product name match
    -- For purchases, match by item_name
    SELECT * INTO inventory_record
    FROM public.inventory
    WHERE user_id = NEW.user_id 
    AND LOWER(TRIM(product_name)) = LOWER(TRIM(NEW.item_name))
    LIMIT 1;
    
    IF FOUND THEN
        -- Increase stock by purchase quantity
        IF TG_OP = 'INSERT' THEN
            UPDATE public.inventory
            SET current_stock = current_stock + NEW.quantity
            WHERE id = inventory_record.id;
            
            -- Log stock movement
            INSERT INTO public.stock_movements (
                user_id,
                inventory_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                movement_date,
                notes
            ) VALUES (
                NEW.user_id,
                inventory_record.id,
                'IN',
                NEW.quantity,
                'PURCHASE',
                NEW.id,
                NEW.date,
                'Auto-added from purchase: ' || NEW.invoice_number
            );
            
        ELSIF TG_OP = 'UPDATE' THEN
            DECLARE
                qty_difference NUMERIC;
            BEGIN
                qty_difference = NEW.quantity - OLD.quantity;
                
                IF qty_difference != 0 THEN
                    UPDATE public.inventory
                    SET current_stock = current_stock + qty_difference
                    WHERE id = inventory_record.id;
                    
                    INSERT INTO public.stock_movements (
                        user_id,
                        inventory_id,
                        movement_type,
                        quantity,
                        reference_type,
                        reference_id,
                        movement_date,
                        notes
                    ) VALUES (
                        NEW.user_id,
                        inventory_record.id,
                        CASE WHEN qty_difference > 0 THEN 'IN' ELSE 'OUT' END,
                        ABS(qty_difference),
                        'PURCHASE',
                        NEW.id,
                        NEW.date,
                        'Purchase quantity updated'
                    );
                END IF;
            END;
            
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.inventory
            SET current_stock = current_stock - OLD.quantity
            WHERE id = inventory_record.id;
            
            INSERT INTO public.stock_movements (
                user_id,
                inventory_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                movement_date,
                notes
            ) VALUES (
                OLD.user_id,
                inventory_record.id,
                'OUT',
                OLD.quantity,
                'PURCHASE',
                OLD.id,
                OLD.date,
                'Purchase deleted - stock removed'
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto stock update on purchases
DROP TRIGGER IF EXISTS auto_stock_update_on_purchase ON public.purchases;
CREATE TRIGGER auto_stock_update_on_purchase
    AFTER INSERT OR UPDATE OR DELETE ON public.purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_purchase();

-- Function to update inventory stock on sales return
CREATE OR REPLACE FUNCTION update_inventory_on_sales_return()
RETURNS TRIGGER AS $$
DECLARE
    inventory_record RECORD;
BEGIN
    -- Find matching product in inventory by product name
    SELECT * INTO inventory_record
    FROM public.inventory
    WHERE user_id = NEW.user_id 
    AND LOWER(TRIM(product_name)) = LOWER(TRIM(NEW.product_name))
    LIMIT 1;
    
    IF FOUND THEN
        -- Sales return means stock comes back (increases)
        IF TG_OP = 'INSERT' THEN
            -- New sales return - increase stock
            UPDATE public.inventory
            SET current_stock = current_stock + NEW.quantity
            WHERE id = inventory_record.id;
            
            -- Log stock movement
            INSERT INTO public.stock_movements (
                user_id,
                inventory_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                movement_date,
                notes
            ) VALUES (
                NEW.user_id,
                inventory_record.id,
                'IN',
                NEW.quantity,
                'SALES_RETURN',
                NEW.id,
                NEW.date,
                'Sales return - stock restored: ' || COALESCE(NEW.reason, 'No reason')
            );
            
        ELSIF TG_OP = 'UPDATE' THEN
            -- Sales return updated - adjust stock difference
            DECLARE
                qty_difference NUMERIC;
            BEGIN
                qty_difference = NEW.quantity - OLD.quantity;
                
                IF qty_difference != 0 THEN
                    UPDATE public.inventory
                    SET current_stock = current_stock + qty_difference
                    WHERE id = inventory_record.id;
                    
                    INSERT INTO public.stock_movements (
                        user_id,
                        inventory_id,
                        movement_type,
                        quantity,
                        reference_type,
                        reference_id,
                        movement_date,
                        notes
                    ) VALUES (
                        NEW.user_id,
                        inventory_record.id,
                        CASE WHEN qty_difference > 0 THEN 'IN' ELSE 'OUT' END,
                        ABS(qty_difference),
                        'SALES_RETURN',
                        NEW.id,
                        NEW.date,
                        'Sales return quantity adjusted'
                    );
                END IF;
            END;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- Sales return deleted - remove stock
            UPDATE public.inventory
            SET current_stock = current_stock - OLD.quantity
            WHERE id = inventory_record.id;
            
            INSERT INTO public.stock_movements (
                user_id,
                inventory_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                movement_date,
                notes
            ) VALUES (
                OLD.user_id,
                inventory_record.id,
                'OUT',
                OLD.quantity,
                'SALES_RETURN',
                OLD.id,
                OLD.date,
                'Sales return deleted'
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update inventory stock on purchase return
CREATE OR REPLACE FUNCTION update_inventory_on_purchase_return()
RETURNS TRIGGER AS $$
DECLARE
    inventory_record RECORD;
BEGIN
    -- Find matching product in inventory by item name
    SELECT * INTO inventory_record
    FROM public.inventory
    WHERE user_id = NEW.user_id 
    AND LOWER(TRIM(product_name)) = LOWER(TRIM(NEW.item_name))
    LIMIT 1;
    
    IF FOUND THEN
        -- Purchase return means stock goes out (decreases)
        IF TG_OP = 'INSERT' THEN
            -- New purchase return - decrease stock
            UPDATE public.inventory
            SET current_stock = current_stock - NEW.quantity
            WHERE id = inventory_record.id;
            
            -- Log stock movement
            INSERT INTO public.stock_movements (
                user_id,
                inventory_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                movement_date,
                notes
            ) VALUES (
                NEW.user_id,
                inventory_record.id,
                'OUT',
                NEW.quantity,
                'PURCHASE_RETURN',
                NEW.id,
                NEW.date,
                'Purchase return - stock removed: ' || COALESCE(NEW.reason, 'No reason')
            );
            
        ELSIF TG_OP = 'UPDATE' THEN
            -- Purchase return updated - adjust stock difference
            DECLARE
                qty_difference NUMERIC;
            BEGIN
                qty_difference = NEW.quantity - OLD.quantity;
                
                IF qty_difference != 0 THEN
                    UPDATE public.inventory
                    SET current_stock = current_stock - qty_difference
                    WHERE id = inventory_record.id;
                    
                    INSERT INTO public.stock_movements (
                        user_id,
                        inventory_id,
                        movement_type,
                        quantity,
                        reference_type,
                        reference_id,
                        movement_date,
                        notes
                    ) VALUES (
                        NEW.user_id,
                        inventory_record.id,
                        CASE WHEN qty_difference > 0 THEN 'OUT' ELSE 'IN' END,
                        ABS(qty_difference),
                        'PURCHASE_RETURN',
                        NEW.id,
                        NEW.date,
                        'Purchase return quantity adjusted'
                    );
                END IF;
            END;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- Purchase return deleted - restore stock
            UPDATE public.inventory
            SET current_stock = current_stock + OLD.quantity
            WHERE id = inventory_record.id;
            
            INSERT INTO public.stock_movements (
                user_id,
                inventory_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                movement_date,
                notes
            ) VALUES (
                OLD.user_id,
                inventory_record.id,
                'IN',
                OLD.quantity,
                'PURCHASE_RETURN',
                OLD.id,
                OLD.date,
                'Purchase return deleted - stock restored'
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto stock update on sales returns
DROP TRIGGER IF EXISTS auto_stock_update_on_sales_return ON public.sales_returns;
CREATE TRIGGER auto_stock_update_on_sales_return
    AFTER INSERT OR UPDATE OR DELETE ON public.sales_returns
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_sales_return();

-- Create trigger for auto stock update on purchase returns
DROP TRIGGER IF EXISTS auto_stock_update_on_purchase_return ON public.purchase_returns;
CREATE TRIGGER auto_stock_update_on_purchase_return
    AFTER INSERT OR UPDATE OR DELETE ON public.purchase_returns
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_purchase_return();

-- Comments explaining the features
COMMENT ON FUNCTION update_inventory_on_sale() IS 
'Automatically updates inventory stock when sales are created, updated, or deleted. Matches by product_name (case-insensitive).';

COMMENT ON FUNCTION update_inventory_on_purchase() IS 
'Automatically updates inventory stock when purchases are created, updated, or deleted. Matches by item_name to product_name (case-insensitive).';

COMMENT ON FUNCTION update_inventory_on_sales_return() IS 
'Automatically increases inventory stock when sales returns are recorded. Customer returned item → stock increases.';

COMMENT ON FUNCTION update_inventory_on_purchase_return() IS 
'Automatically decreases inventory stock when purchase returns are recorded. Returned to supplier → stock decreases.';
