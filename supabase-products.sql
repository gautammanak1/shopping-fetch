-- Create the products table for t-shirts
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  sizes JSONB NOT NULL DEFAULT '["S", "M", "L", "XL", "XXL"]'::jsonb,
  stock JSONB NOT NULL DEFAULT '{"S": 0, "M": 0, "L": 0, "XL": 0, "XXL": 0}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on active products for faster queries
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- Create orders table for tracking purchases
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);

-- Add comments
COMMENT ON TABLE products IS 'Stores t-shirt products with sizes and stock';
COMMENT ON TABLE orders IS 'Stores customer orders for t-shirts';

