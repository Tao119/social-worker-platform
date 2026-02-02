-- Seed realistic facility data

-- Update facility types based on name patterns
UPDATE facilities SET facility_type = '特別養護老人ホーム' WHERE name LIKE '%特養%' OR name LIKE '%さくら%';
UPDATE facilities SET facility_type = '介護老人保健施設' WHERE name LIKE '%老健%' OR name LIKE '%ひまわり%';
UPDATE facilities SET facility_type = 'グループホーム' WHERE name LIKE '%グループ%' OR name LIKE '%もみじ%';
UPDATE facilities SET facility_type = '有料老人ホーム' WHERE name LIKE '%有料%' OR name LIKE '%ケアセンター%';
UPDATE facilities SET facility_type = '介護医療院' WHERE name LIKE '%医療%';

-- Update descriptions
UPDATE facilities SET description =
    CASE
        WHEN facility_type = '特別養護老人ホーム' THEN '24時間体制の介護サービスを提供する特別養護老人ホームです。経験豊富なスタッフが、一人ひとりに寄り添ったケアを行います。'
        WHEN facility_type = '介護老人保健施設' THEN 'リハビリテーションを中心とした在宅復帰支援を行う介護老人保健施設です。理学療法士・作業療法士が常駐しています。'
        WHEN facility_type = 'グループホーム' THEN '認知症の方が少人数で家庭的な環境の中、穏やかに過ごせるグループホームです。個別ケアを大切にしています。'
        WHEN facility_type = '有料老人ホーム' THEN '快適な居住空間と充実したサービスを提供する有料老人ホームです。自立から要介護まで幅広く対応します。'
        ELSE '地域に根ざした介護サービスを提供しています。お気軽にお問い合わせください。'
    END
WHERE description IS NULL;

-- Update contact names with realistic Japanese names
UPDATE facilities SET contact_name =
    CASE (id % 20)
        WHEN 0 THEN '山田 花子'
        WHEN 1 THEN '佐藤 一郎'
        WHEN 2 THEN '鈴木 美咲'
        WHEN 3 THEN '高橋 健太'
        WHEN 4 THEN '田中 由美子'
        WHEN 5 THEN '伊藤 大輔'
        WHEN 6 THEN '渡辺 真由美'
        WHEN 7 THEN '中村 誠'
        WHEN 8 THEN '小林 さくら'
        WHEN 9 THEN '加藤 隆'
        WHEN 10 THEN '吉田 理恵'
        WHEN 11 THEN '山口 太郎'
        WHEN 12 THEN '松本 恵子'
        WHEN 13 THEN '井上 翔太'
        WHEN 14 THEN '木村 明日香'
        WHEN 15 THEN '林 和彦'
        WHEN 16 THEN '斎藤 麻衣'
        WHEN 17 THEN '清水 雄介'
        WHEN 18 THEN '森 千尋'
        ELSE '岡田 浩二'
    END
WHERE contact_name IS NULL;

-- Update acceptance conditions JSON with varying conditions per facility
UPDATE facilities SET acceptance_conditions_json =
    CASE
        WHEN id % 5 = 0 THEN '{"ventilator": true, "iv_antibiotics": true, "tube_feeding": true, "tracheostomy": true, "dialysis": false, "oxygen": true, "pressure_ulcer": true, "dementia": true}'::jsonb
        WHEN id % 5 = 1 THEN '{"ventilator": false, "iv_antibiotics": true, "tube_feeding": true, "tracheostomy": false, "dialysis": true, "oxygen": true, "pressure_ulcer": true, "dementia": true}'::jsonb
        WHEN id % 5 = 2 THEN '{"ventilator": false, "iv_antibiotics": false, "tube_feeding": true, "tracheostomy": false, "dialysis": false, "oxygen": true, "pressure_ulcer": true, "dementia": true}'::jsonb
        WHEN id % 5 = 3 THEN '{"ventilator": true, "iv_antibiotics": true, "tube_feeding": true, "tracheostomy": true, "dialysis": true, "oxygen": true, "pressure_ulcer": true, "dementia": false}'::jsonb
        ELSE '{"ventilator": false, "iv_antibiotics": true, "tube_feeding": false, "tracheostomy": false, "dialysis": false, "oxygen": true, "pressure_ulcer": false, "dementia": true}'::jsonb
    END
WHERE acceptance_conditions_json = '{}' OR acceptance_conditions_json IS NULL;

-- Update contact hours with varying schedules
UPDATE facilities SET contact_hours =
    CASE (id % 4)
        WHEN 0 THEN '9:00 - 17:00（平日のみ）'
        WHEN 1 THEN '8:30 - 17:30（土日祝休み）'
        WHEN 2 THEN '9:00 - 18:00（年中無休）'
        ELSE '9:00 - 17:00'
    END
WHERE contact_hours = '9:00 - 17:00' OR contact_hours IS NULL;

-- Insert sample facility images using placeholder URLs
-- Main exterior image for each facility
INSERT INTO facility_images (facility_id, image_url, image_type, sort_order, caption)
SELECT
    id,
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=600&fit=crop',
    'exterior',
    1,
    name || ' 外観'
FROM facilities
WHERE id <= 20;

-- Interior images
INSERT INTO facility_images (facility_id, image_url, image_type, sort_order, caption)
SELECT
    id,
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
    'interior',
    2,
    '共用スペース'
FROM facilities
WHERE id <= 20;

-- Room images
INSERT INTO facility_images (facility_id, image_url, image_type, sort_order, caption)
SELECT
    id,
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=600&fit=crop',
    'room',
    3,
    '居室'
FROM facilities
WHERE id <= 20;

-- Dining images
INSERT INTO facility_images (facility_id, image_url, image_type, sort_order, caption)
SELECT
    id,
    'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&h=600&fit=crop',
    'dining',
    4,
    '食堂'
FROM facilities
WHERE id <= 20;
