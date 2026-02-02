-- トリガーとテーブルを削除
DROP TRIGGER IF EXISTS trigger_update_available_beds ON facility_room_types;
DROP FUNCTION IF EXISTS update_facility_available_beds();
DROP TABLE IF EXISTS facility_room_types;
