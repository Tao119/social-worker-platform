-- Add location and cost fields to facilities table for enhanced search
ALTER TABLE facilities ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE facilities ADD COLUMN longitude DECIMAL(11, 8);
ALTER TABLE facilities ADD COLUMN monthly_fee INTEGER;
ALTER TABLE facilities ADD COLUMN medicine_cost INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN facilities.latitude IS '施設の緯度';
COMMENT ON COLUMN facilities.longitude IS '施設の経度';
COMMENT ON COLUMN facilities.monthly_fee IS '月額利用料（円）';
COMMENT ON COLUMN facilities.medicine_cost IS '薬剤費（円）';

-- Create indexes for efficient range queries
CREATE INDEX idx_facilities_monthly_fee ON facilities(monthly_fee) WHERE monthly_fee IS NOT NULL;
CREATE INDEX idx_facilities_medicine_cost ON facilities(medicine_cost) WHERE medicine_cost IS NOT NULL;
CREATE INDEX idx_facilities_location ON facilities(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
