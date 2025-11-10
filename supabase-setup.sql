-- Create the coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on the code column for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Add a comment to the table
COMMENT ON TABLE coupons IS 'Stores pizza coupon codes and their verification status';

