-- Add user details to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_phone TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS awb_number TEXT,
ADD COLUMN IF NOT EXISTS delivery_partner_id UUID,
ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT,
ADD COLUMN IF NOT EXISTS shiprocket_shipment_id INTEGER,
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE,
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create delivery partners table (like Shiprocket)
CREATE TABLE IF NOT EXISTS delivery_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'standard' CHECK (service_type IN ('standard', 'express', 'same_day')),
  active BOOLEAN DEFAULT true,
  assigned_orders_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create dealers table (for backward compatibility)
CREATE TABLE IF NOT EXISTS dealers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  assigned_orders_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_active ON delivery_partners(active);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_location ON delivery_partners(location);

-- Add foreign key constraint
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_delivery_partner 
FOREIGN KEY (delivery_partner_id) 
REFERENCES delivery_partners(id) 
ON DELETE SET NULL;

-- Add comments
COMMENT ON COLUMN orders.user_name IS 'Customer name who placed the order';
COMMENT ON COLUMN orders.user_email IS 'Customer email for order updates';
COMMENT ON COLUMN orders.user_phone IS 'Customer phone number';
COMMENT ON COLUMN orders.shipping_address IS 'Delivery address';
COMMENT ON COLUMN orders.tracking_number IS 'Unique tracking number for order';
COMMENT ON COLUMN orders.awb_number IS 'Shiprocket AWB (Airway Bill) number';
COMMENT ON COLUMN orders.shiprocket_order_id IS 'Shiprocket order ID';
COMMENT ON COLUMN orders.shiprocket_shipment_id IS 'Shiprocket shipment ID';
COMMENT ON COLUMN orders.delivery_partner_id IS 'Delivery partner assigned to this order';
COMMENT ON COLUMN orders.shipping_cost IS 'Shipping cost for this order';
COMMENT ON COLUMN orders.estimated_delivery_date IS 'Estimated delivery date';
COMMENT ON COLUMN orders.service_type IS 'Shipping service type: standard, express, same_day';
COMMENT ON TABLE delivery_partners IS 'Delivery partners like Shiprocket who handle shipping';
COMMENT ON TABLE dealers IS 'Dealers and delivery partners (legacy)';

