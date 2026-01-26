-- テストアカウント作成スクリプト
-- パスワードは全て "password123"

-- 病院アカウント (5件)
INSERT INTO users (email, password_hash, role, created_at, updated_at) VALUES
('hospital1@example.com', '$2a$10$R.GOdkY8W.ADlrWOdikHX.7H3W7b/hXx7QEp6CT/11sCQJhHlHO72', 'hospital', NOW(), NOW()),
('hospital2@example.com', '$2a$10$R.GOdkY8W.ADlrWOdikHX.7H3W7b/hXx7QEp6CT/11sCQJhHlHO72', 'hospital', NOW(), NOW()),
('hospital3@example.com', '$2a$10$R.GOdkY8W.ADlrWOdikHX.7H3W7b/hXx7QEp6CT/11sCQJhHlHO72', 'hospital', NOW(), NOW()),
('hospital4@example.com', '$2a$10$R.GOdkY8W.ADlrWOdikHX.7H3W7b/hXx7QEp6CT/11sCQJhHlHO72', 'hospital', NOW(), NOW()),
('hospital5@example.com', '$2a$10$R.GOdkY8W.ADlrWOdikHX.7H3W7b/hXx7QEp6CT/11sCQJhHlHO72', 'hospital', NOW(), NOW());

-- 病院情報
INSERT INTO hospitals (user_id, name, address, phone, created_at, updated_at)
SELECT id, 
  CASE 
    WHEN email = 'hospital1@example.com' THEN '東京総合病院'
    WHEN email = 'hospital2@example.com' THEN '大阪医療センター'
    WHEN email = 'hospital3@example.com' THEN '名古屋中央病院'
    WHEN email = 'hospital4@example.com' THEN '福岡総合医療センター'
    WHEN email = 'hospital5@example.com' THEN '札幌市立病院'
  END,
  CASE 
    WHEN email = 'hospital1@example.com' THEN '東京都新宿区西新宿1-1-1'
    WHEN email = 'hospital2@example.com' THEN '大阪府大阪市北区梅田2-2-2'
    WHEN email = 'hospital3@example.com' THEN '愛知県名古屋市中区栄3-3-3'
    WHEN email = 'hospital4@example.com' THEN '福岡県福岡市博多区博多駅前4-4-4'
    WHEN email = 'hospital5@example.com' THEN '北海道札幌市中央区北1条西5-5-5'
  END,
  CASE 
    WHEN email = 'hospital1@example.com' THEN '03-1234-5678'
    WHEN email = 'hospital2@example.com' THEN '06-2345-6789'
    WHEN email = 'hospital3@example.com' THEN '052-345-6789'
    WHEN email = 'hospital4@example.com' THEN '092-456-7890'
    WHEN email = 'hospital5@example.com' THEN '011-567-8901'
  END,
  NOW(), NOW()
FROM users WHERE role = 'hospital';

-- 施設アカウント (100件)
INSERT INTO users (email, password_hash, role, created_at, updated_at)
SELECT 
  'facility' || generate_series(1, 100) || '@example.com',
  '$2a$10$R.GOdkY8W.ADlrWOdikHX.7H3W7b/hXx7QEp6CT/11sCQJhHlHO72',
  'facility',
  NOW(),
  NOW();

-- 施設情報 (100件)
INSERT INTO facilities (user_id, name, address, phone, bed_capacity, acceptance_conditions, created_at, updated_at)
SELECT 
  u.id,
  CASE 
    WHEN (row_number() OVER ()) % 10 = 1 THEN 'さくら介護施設'
    WHEN (row_number() OVER ()) % 10 = 2 THEN 'ひまわり老人ホーム'
    WHEN (row_number() OVER ()) % 10 = 3 THEN 'もみじケアセンター'
    WHEN (row_number() OVER ()) % 10 = 4 THEN 'すみれ療養施設'
    WHEN (row_number() OVER ()) % 10 = 5 THEN 'つばき介護ホーム'
    WHEN (row_number() OVER ()) % 10 = 6 THEN 'あやめ福祉施設'
    WHEN (row_number() OVER ()) % 10 = 7 THEN 'ゆり看護施設'
    WHEN (row_number() OVER ()) % 10 = 8 THEN 'きく療養センター'
    WHEN (row_number() OVER ()) % 10 = 9 THEN 'うめ介護施設'
    ELSE 'ふじ老人ホーム'
  END || (row_number() OVER ()),
  CASE 
    WHEN (row_number() OVER ()) <= 20 THEN '東京都' || ((row_number() OVER () - 1) % 20 + 1) || '区'
    WHEN (row_number() OVER ()) <= 40 THEN '大阪府大阪市' || ((row_number() OVER () - 21) % 20 + 1) || '区'
    WHEN (row_number() OVER ()) <= 60 THEN '愛知県名古屋市' || ((row_number() OVER () - 41) % 20 + 1) || '区'
    WHEN (row_number() OVER ()) <= 80 THEN '福岡県福岡市' || ((row_number() OVER () - 61) % 20 + 1) || '区'
    ELSE '北海道札幌市' || ((row_number() OVER () - 81) % 20 + 1) || '区'
  END || ((row_number() OVER () - 1) % 9 + 1) || '-' || ((row_number() OVER () - 1) % 9 + 1) || '-' || ((row_number() OVER () - 1) % 9 + 1),
  '0' || ((row_number() OVER () - 1) % 9 + 1) || '-' || (1000 + (row_number() OVER ())) || '-' || (5000 + (row_number() OVER ())),
  ((row_number() OVER () - 1) % 50 + 20),
  CASE 
    WHEN (row_number() OVER ()) % 3 = 0 THEN '特別養護老人ホーム。24時間看護体制。医療依存度の高い方も受け入れ可能。'
    WHEN (row_number() OVER ()) % 3 = 1 THEN '介護老人保健施設。リハビリテーション重視。在宅復帰を目指す方向け。'
    ELSE '有料老人ホーム。個室完備。看取りまで対応可能。'
  END,
  NOW(),
  NOW()
FROM users u
WHERE u.role = 'facility'
ORDER BY u.id;
