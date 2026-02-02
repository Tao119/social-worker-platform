-- 施設の部屋種別データを投入
-- 各施設に個室・2人部屋・4人部屋を設定

-- 既存のavailable_bedsを一旦リセット
UPDATE facilities SET available_beds = 0;

-- 施設1-34: 特別養護老人ホーム（id % 3 = 1）
-- 定員の内訳: 個室10, 2人部屋6(12人), 4人部屋2(8人) = 計30床前後
INSERT INTO facility_room_types (facility_id, room_type, capacity, available, monthly_fee, description)
SELECT
    id,
    '個室',
    CASE WHEN bed_capacity >= 30 THEN 12 ELSE 8 END,
    CASE WHEN bed_capacity >= 30 THEN FLOOR(RANDOM() * 4) ELSE FLOOR(RANDOM() * 3) END,
    180000,
    'プライベートな空間で快適にお過ごしいただけます'
FROM facilities WHERE id % 3 = 1;

INSERT INTO facility_room_types (facility_id, room_type, capacity, available, monthly_fee, description)
SELECT
    id,
    '2人部屋',
    CASE WHEN bed_capacity >= 30 THEN 8 ELSE 6 END,
    CASE WHEN bed_capacity >= 30 THEN FLOOR(RANDOM() * 3) ELSE FLOOR(RANDOM() * 2) END,
    150000,
    '2名様でご利用いただける広々としたお部屋です'
FROM facilities WHERE id % 3 = 1;

INSERT INTO facility_room_types (facility_id, room_type, capacity, available, monthly_fee, description)
SELECT
    id,
    '4人部屋',
    CASE WHEN bed_capacity >= 30 THEN 12 ELSE 8 END,
    CASE WHEN bed_capacity >= 30 THEN FLOOR(RANDOM() * 4) ELSE FLOOR(RANDOM() * 3) END,
    120000,
    '他の入居者様と交流しながら過ごせるお部屋です'
FROM facilities WHERE id % 3 = 1;

-- 施設2-35: 介護老人保健施設（id % 3 = 2）
-- 定員の内訳: 個室6, 2人部屋8(16人), 4人部屋2(8人) = 計30床前後
INSERT INTO facility_room_types (facility_id, room_type, capacity, available, monthly_fee, description)
SELECT
    id,
    '個室',
    CASE WHEN bed_capacity >= 30 THEN 8 ELSE 6 END,
    CASE WHEN bed_capacity >= 30 THEN FLOOR(RANDOM() * 3) ELSE FLOOR(RANDOM() * 2) END,
    160000,
    'リハビリに集中できる個室です'
FROM facilities WHERE id % 3 = 2;

INSERT INTO facility_room_types (facility_id, room_type, capacity, available, monthly_fee, description)
SELECT
    id,
    '2人部屋',
    CASE WHEN bed_capacity >= 30 THEN 10 ELSE 8 END,
    CASE WHEN bed_capacity >= 30 THEN FLOOR(RANDOM() * 4) ELSE FLOOR(RANDOM() * 3) END,
    130000,
    '2名様でご利用いただけるお部屋です'
FROM facilities WHERE id % 3 = 2;

INSERT INTO facility_room_types (facility_id, room_type, capacity, available, monthly_fee, description)
SELECT
    id,
    '4人部屋',
    CASE WHEN bed_capacity >= 30 THEN 12 ELSE 8 END,
    CASE WHEN bed_capacity >= 30 THEN FLOOR(RANDOM() * 4) ELSE FLOOR(RANDOM() * 3) END,
    100000,
    '多床室でスタッフの目が届きやすい環境です'
FROM facilities WHERE id % 3 = 2;

-- 施設3-36: 有料老人ホーム（id % 3 = 0）
-- 定員の内訳: 個室が多め 個室16, 2人部屋6(12人), 4人部屋0 = 計28床前後
INSERT INTO facility_room_types (facility_id, room_type, capacity, available, monthly_fee, description)
SELECT
    id,
    '個室',
    CASE WHEN bed_capacity >= 30 THEN 18 ELSE 14 END,
    CASE WHEN bed_capacity >= 30 THEN FLOOR(RANDOM() * 5) ELSE FLOOR(RANDOM() * 4) END,
    220000,
    '充実した設備を備えた快適な個室です'
FROM facilities WHERE id % 3 = 0;

INSERT INTO facility_room_types (facility_id, room_type, capacity, available, monthly_fee, description)
SELECT
    id,
    '2人部屋',
    CASE WHEN bed_capacity >= 30 THEN 10 ELSE 8 END,
    CASE WHEN bed_capacity >= 30 THEN FLOOR(RANDOM() * 3) ELSE FLOOR(RANDOM() * 2) END,
    180000,
    'ご夫婦でのご利用にも適した広めのお部屋です'
FROM facilities WHERE id % 3 = 0;

-- bed_capacityを部屋種別の合計に更新
UPDATE facilities f SET
    bed_capacity = (
        SELECT COALESCE(SUM(capacity), 0)
        FROM facility_room_types frt
        WHERE frt.facility_id = f.id
    );

-- available_bedsを部屋種別の空き合計に更新（トリガーで自動更新されるが念のため）
UPDATE facilities f SET
    available_beds = (
        SELECT COALESCE(SUM(available), 0)
        FROM facility_room_types frt
        WHERE frt.facility_id = f.id
    );
