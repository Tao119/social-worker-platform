-- 施設の部屋種別テーブルを作成
-- 部屋種別ごとに定員と空き状況を管理

CREATE TABLE IF NOT EXISTS facility_room_types (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    room_type VARCHAR(50) NOT NULL,  -- '個室', '2人部屋', '4人部屋' など
    capacity INTEGER NOT NULL CHECK (capacity > 0),  -- この種別の定員
    available INTEGER NOT NULL DEFAULT 0 CHECK (available >= 0),  -- 空き数
    monthly_fee INTEGER,  -- この部屋種別の月額料金
    description TEXT,  -- 部屋の説明
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT available_not_exceed_capacity CHECK (available <= capacity),
    UNIQUE(facility_id, room_type)
);

CREATE INDEX idx_facility_room_types_facility_id ON facility_room_types(facility_id);
CREATE INDEX idx_facility_room_types_room_type ON facility_room_types(room_type);
CREATE INDEX idx_facility_room_types_available ON facility_room_types(available) WHERE available > 0;

-- コメント
COMMENT ON TABLE facility_room_types IS '施設の部屋種別ごとの空き状況';
COMMENT ON COLUMN facility_room_types.room_type IS '部屋種別（個室、2人部屋、4人部屋など）';
COMMENT ON COLUMN facility_room_types.capacity IS 'この部屋種別の定員';
COMMENT ON COLUMN facility_room_types.available IS 'この部屋種別の空き数';
COMMENT ON COLUMN facility_room_types.monthly_fee IS 'この部屋種別の月額料金';

-- facilitiesテーブルのavailable_bedsを更新するトリガー関数
CREATE OR REPLACE FUNCTION update_facility_available_beds()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE facilities
    SET available_beds = (
        SELECT COALESCE(SUM(available), 0)
        FROM facility_room_types
        WHERE facility_id = COALESCE(NEW.facility_id, OLD.facility_id)
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.facility_id, OLD.facility_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
CREATE TRIGGER trigger_update_available_beds
AFTER INSERT OR UPDATE OR DELETE ON facility_room_types
FOR EACH ROW
EXECUTE FUNCTION update_facility_available_beds();
