-- テストアカウント住所・画像更新スクリプト
-- 実際に存在する地名を使用

-- ============================================
-- 病院の住所を更新
-- ============================================
UPDATE hospitals SET address = '東京都新宿区西新宿2-8-1' WHERE name = '東京総合病院';
UPDATE hospitals SET address = '大阪府大阪市北区梅田1-11-4' WHERE name = '大阪医療センター';
UPDATE hospitals SET address = '愛知県名古屋市中区栄3-15-33' WHERE name = '名古屋中央病院';
UPDATE hospitals SET address = '福岡県福岡市博多区博多駅前3-25-21' WHERE name = '福岡総合医療センター';
UPDATE hospitals SET address = '北海道札幌市中央区北1条西2-1' WHERE name = '札幌市立病院';

-- ============================================
-- 施設の住所を実際の地名に更新
-- ============================================

-- 東京都 (施設1-20)
UPDATE facilities SET address = '東京都千代田区丸の内1-9-1' WHERE id = 1;
UPDATE facilities SET address = '東京都中央区日本橋2-1-3' WHERE id = 2;
UPDATE facilities SET address = '東京都港区六本木6-10-1' WHERE id = 3;
UPDATE facilities SET address = '東京都新宿区新宿3-38-1' WHERE id = 4;
UPDATE facilities SET address = '東京都文京区本郷7-3-1' WHERE id = 5;
UPDATE facilities SET address = '東京都台東区上野公園5-20' WHERE id = 6;
UPDATE facilities SET address = '東京都墨田区押上1-1-2' WHERE id = 7;
UPDATE facilities SET address = '東京都江東区豊洲6-1-16' WHERE id = 8;
UPDATE facilities SET address = '東京都品川区大崎1-6-3' WHERE id = 9;
UPDATE facilities SET address = '東京都目黒区自由が丘1-29-3' WHERE id = 10;
UPDATE facilities SET address = '東京都大田区蒲田5-13-14' WHERE id = 11;
UPDATE facilities SET address = '東京都世田谷区三軒茶屋2-11-22' WHERE id = 12;
UPDATE facilities SET address = '東京都渋谷区道玄坂2-29-5' WHERE id = 13;
UPDATE facilities SET address = '東京都中野区中野4-10-2' WHERE id = 14;
UPDATE facilities SET address = '東京都杉並区阿佐谷北1-1-1' WHERE id = 15;
UPDATE facilities SET address = '東京都豊島区東池袋1-18-1' WHERE id = 16;
UPDATE facilities SET address = '東京都北区赤羽1-1-38' WHERE id = 17;
UPDATE facilities SET address = '東京都荒川区西日暮里5-38-1' WHERE id = 18;
UPDATE facilities SET address = '東京都板橋区板橋1-55-16' WHERE id = 19;
UPDATE facilities SET address = '東京都練馬区豊玉北5-17-12' WHERE id = 20;

-- 大阪府大阪市 (施設21-40)
UPDATE facilities SET address = '大阪府大阪市北区角田町8-7' WHERE id = 21;
UPDATE facilities SET address = '大阪府大阪市都島区東野田町2-1-38' WHERE id = 22;
UPDATE facilities SET address = '大阪府大阪市福島区福島5-4-21' WHERE id = 23;
UPDATE facilities SET address = '大阪府大阪市此花区島屋6-2-61' WHERE id = 24;
UPDATE facilities SET address = '大阪府大阪市西区江戸堀1-2-1' WHERE id = 25;
UPDATE facilities SET address = '大阪府大阪市港区弁天1-2-1' WHERE id = 26;
UPDATE facilities SET address = '大阪府大阪市大正区三軒家東1-12-17' WHERE id = 27;
UPDATE facilities SET address = '大阪府大阪市天王寺区悲田院町10-39' WHERE id = 28;
UPDATE facilities SET address = '大阪府大阪市浪速区難波中2-10-70' WHERE id = 29;
UPDATE facilities SET address = '大阪府大阪市西淀川区御幣島1-2-10' WHERE id = 30;
UPDATE facilities SET address = '大阪府大阪市東淀川区東中島1-20-14' WHERE id = 31;
UPDATE facilities SET address = '大阪府大阪市東成区大今里南6-1-1' WHERE id = 32;
UPDATE facilities SET address = '大阪府大阪市生野区勝山北1-11-6' WHERE id = 33;
UPDATE facilities SET address = '大阪府大阪市旭区千林1-4-3' WHERE id = 34;
UPDATE facilities SET address = '大阪府大阪市城東区野江1-1-1' WHERE id = 35;
UPDATE facilities SET address = '大阪府大阪市阿倍野区阿倍野筋1-1-43' WHERE id = 36;
UPDATE facilities SET address = '大阪府大阪市住吉区長居公園1-1' WHERE id = 37;
UPDATE facilities SET address = '大阪府大阪市東住吉区駒川5-4-24' WHERE id = 38;
UPDATE facilities SET address = '大阪府大阪市西成区玉出中1-11-23' WHERE id = 39;
UPDATE facilities SET address = '大阪府大阪市淀川区西中島5-16-1' WHERE id = 40;

-- 愛知県名古屋市 (施設41-60)
UPDATE facilities SET address = '愛知県名古屋市千種区今池1-4-18' WHERE id = 41;
UPDATE facilities SET address = '愛知県名古屋市東区泉1-23-36' WHERE id = 42;
UPDATE facilities SET address = '愛知県名古屋市北区清水4-17-1' WHERE id = 43;
UPDATE facilities SET address = '愛知県名古屋市西区則武新町3-1-17' WHERE id = 44;
UPDATE facilities SET address = '愛知県名古屋市中村区名駅4-7-1' WHERE id = 45;
UPDATE facilities SET address = '愛知県名古屋市中区栄3-4-5' WHERE id = 46;
UPDATE facilities SET address = '愛知県名古屋市昭和区鶴舞1-1-3' WHERE id = 47;
UPDATE facilities SET address = '愛知県名古屋市瑞穂区堀田通8-14' WHERE id = 48;
UPDATE facilities SET address = '愛知県名古屋市熱田区神宮1-1-1' WHERE id = 49;
UPDATE facilities SET address = '愛知県名古屋市中川区尾頭橋3-8-1' WHERE id = 50;
UPDATE facilities SET address = '愛知県名古屋市港区港明1-10-20' WHERE id = 51;
UPDATE facilities SET address = '愛知県名古屋市南区笠寺町字横吹66' WHERE id = 52;
UPDATE facilities SET address = '愛知県名古屋市守山区守山3-11-28' WHERE id = 53;
UPDATE facilities SET address = '愛知県名古屋市緑区大高町字大根山1-1' WHERE id = 54;
UPDATE facilities SET address = '愛知県名古屋市名東区藤が丘141' WHERE id = 55;
UPDATE facilities SET address = '愛知県名古屋市天白区植田3-1502' WHERE id = 56;
UPDATE facilities SET address = '愛知県名古屋市千種区星が丘元町14-25' WHERE id = 57;
UPDATE facilities SET address = '愛知県名古屋市東区東桜1-13-3' WHERE id = 58;
UPDATE facilities SET address = '愛知県名古屋市北区大曽根3-15-58' WHERE id = 59;
UPDATE facilities SET address = '愛知県名古屋市西区牛島町6-1' WHERE id = 60;

-- 福岡県福岡市 (施設61-80)
UPDATE facilities SET address = '福岡県福岡市東区箱崎1-26-1' WHERE id = 61;
UPDATE facilities SET address = '福岡県福岡市博多区博多駅中央街1-1' WHERE id = 62;
UPDATE facilities SET address = '福岡県福岡市中央区天神1-8-1' WHERE id = 63;
UPDATE facilities SET address = '福岡県福岡市南区大橋1-12-1' WHERE id = 64;
UPDATE facilities SET address = '福岡県福岡市西区姪浜駅南1-1-1' WHERE id = 65;
UPDATE facilities SET address = '福岡県福岡市城南区茶山1-1-46' WHERE id = 66;
UPDATE facilities SET address = '福岡県福岡市早良区西新1-8-21' WHERE id = 67;
UPDATE facilities SET address = '福岡県福岡市東区千早4-21-45' WHERE id = 68;
UPDATE facilities SET address = '福岡県福岡市博多区祇園町9-1' WHERE id = 69;
UPDATE facilities SET address = '福岡県福岡市中央区大名2-6-11' WHERE id = 70;
UPDATE facilities SET address = '福岡県福岡市南区高宮3-10-1' WHERE id = 71;
UPDATE facilities SET address = '福岡県福岡市西区下山門1-12-1' WHERE id = 72;
UPDATE facilities SET address = '福岡県福岡市城南区七隈8-19-1' WHERE id = 73;
UPDATE facilities SET address = '福岡県福岡市早良区百道浜3-1-1' WHERE id = 74;
UPDATE facilities SET address = '福岡県福岡市東区香椎駅前1-12-43' WHERE id = 75;
UPDATE facilities SET address = '福岡県福岡市博多区住吉5-1-1' WHERE id = 76;
UPDATE facilities SET address = '福岡県福岡市中央区渡辺通5-1-26' WHERE id = 77;
UPDATE facilities SET address = '福岡県福岡市南区長住2-1-1' WHERE id = 78;
UPDATE facilities SET address = '福岡県福岡市西区今宿東1-1-1' WHERE id = 79;
UPDATE facilities SET address = '福岡県福岡市城南区鳥飼5-2-1' WHERE id = 80;

-- 北海道札幌市 (施設81-100)
UPDATE facilities SET address = '北海道札幌市中央区北5条西4-7' WHERE id = 81;
UPDATE facilities SET address = '北海道札幌市北区北24条西5-1-1' WHERE id = 82;
UPDATE facilities SET address = '北海道札幌市東区北7条東9-2-20' WHERE id = 83;
UPDATE facilities SET address = '北海道札幌市白石区南郷通1丁目南1-1' WHERE id = 84;
UPDATE facilities SET address = '北海道札幌市豊平区月寒中央通7丁目6-20' WHERE id = 85;
UPDATE facilities SET address = '北海道札幌市南区真駒内柏丘1-1' WHERE id = 86;
UPDATE facilities SET address = '北海道札幌市西区琴似2条4-1-2' WHERE id = 87;
UPDATE facilities SET address = '北海道札幌市厚別区厚別中央2条5-6-3' WHERE id = 88;
UPDATE facilities SET address = '北海道札幌市手稲区前田1条11-1-1' WHERE id = 89;
UPDATE facilities SET address = '北海道札幌市清田区平岡1条1-1-1' WHERE id = 90;
UPDATE facilities SET address = '北海道札幌市中央区南1条西3-8' WHERE id = 91;
UPDATE facilities SET address = '北海道札幌市北区北40条西4-2-10' WHERE id = 92;
UPDATE facilities SET address = '北海道札幌市東区北15条東1-1-1' WHERE id = 93;
UPDATE facilities SET address = '北海道札幌市白石区本郷通1丁目北1-1' WHERE id = 94;
UPDATE facilities SET address = '北海道札幌市豊平区平岸3条5-4-22' WHERE id = 95;
UPDATE facilities SET address = '北海道札幌市南区川沿1条1-1-1' WHERE id = 96;
UPDATE facilities SET address = '北海道札幌市西区発寒5条3-7-1' WHERE id = 97;
UPDATE facilities SET address = '北海道札幌市厚別区大谷地東5-1-1' WHERE id = 98;
UPDATE facilities SET address = '北海道札幌市手稲区新発寒5条4-1-1' WHERE id = 99;
UPDATE facilities SET address = '北海道札幌市清田区真栄4条3-1-1' WHERE id = 100;

-- ============================================
-- 施設タイプを更新
-- ============================================
UPDATE facilities SET facility_type = '特別養護老人ホーム' WHERE id % 3 = 1;
UPDATE facilities SET facility_type = '介護老人保健施設' WHERE id % 3 = 2;
UPDATE facilities SET facility_type = '有料老人ホーム' WHERE id % 3 = 0;

-- ============================================
-- 既存の画像を削除
-- ============================================
DELETE FROM facility_images;

-- ============================================
-- 各施設に異なる画像を追加
-- 介護施設・老人ホーム関連のUnsplash画像を使用
-- ============================================

-- 外観画像 (exterior) - 各施設に異なる画像
INSERT INTO facility_images (facility_id, image_url, image_type, sort_order, caption) VALUES
-- 東京都 (1-20)
(1, 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(2, 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(3, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(4, 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(5, 'https://images.unsplash.com/photo-1559599238-308793637427?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(6, 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(7, 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(8, 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(9, 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(10, 'https://images.unsplash.com/photo-1577493340887-b7bfff550145?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(11, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(12, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(13, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(14, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(15, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(16, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(17, 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(18, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(19, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(20, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
-- 大阪府 (21-40)
(21, 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(22, 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(23, 'https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(24, 'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(25, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(26, 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(27, 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(28, 'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(29, 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(30, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(31, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(32, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(33, 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(34, 'https://images.unsplash.com/photo-1549517045-bc93de075e53?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(35, 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(36, 'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(37, 'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(38, 'https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(39, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(40, 'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
-- 愛知県 (41-60)
(41, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(42, 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(43, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(44, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(45, 'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(46, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(47, 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(48, 'https://images.unsplash.com/photo-1560185008-a33f5c7a1638?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(49, 'https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(50, 'https://images.unsplash.com/photo-1560185127-6a0c3d80fc68?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(51, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(52, 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(53, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(54, 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(55, 'https://images.unsplash.com/photo-1560185009-5bf9f2849488?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(56, 'https://images.unsplash.com/photo-1556912998-c57cc6b63cd7?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(57, 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(58, 'https://images.unsplash.com/photo-1560185127-bdf4c6e37b40?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(59, 'https://images.unsplash.com/photo-1560185127-9c7e7e1c4e9c?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(60, 'https://images.unsplash.com/photo-1560185127-d8c4e2e22c60?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
-- 福岡県 (61-80)
(61, 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(62, 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(63, 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(64, 'https://images.unsplash.com/photo-1568092775154-7fa176a29c0f?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(65, 'https://images.unsplash.com/photo-1570544820995-2f5d7e09c5a1?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(66, 'https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(67, 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(68, 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(69, 'https://images.unsplash.com/photo-1584738766473-61c083514bf4?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(70, 'https://images.unsplash.com/photo-1585128792020-803d29415281?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(71, 'https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(72, 'https://images.unsplash.com/photo-1592595896616-c37162298647?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(73, 'https://images.unsplash.com/photo-1597211833712-5e41faa202ea?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(74, 'https://images.unsplash.com/photo-1598714673280-b7c241e9e0e6?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(75, 'https://images.unsplash.com/photo-1599836546533-81a79c7e8ec3?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(76, 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(77, 'https://images.unsplash.com/photo-1600573472591-ee6c563f7e49?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(78, 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(79, 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(80, 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
-- 北海道 (81-100)
(81, 'https://images.unsplash.com/photo-1604014237744-26d9a62a0f96?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(82, 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(83, 'https://images.unsplash.com/photo-1605146768851-eda79da39897?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(84, 'https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(85, 'https://images.unsplash.com/photo-1605146769048-7d8f26c4e1da?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(86, 'https://images.unsplash.com/photo-1606402179428-a57976d71fa4?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(87, 'https://images.unsplash.com/photo-1609347744403-2306e8a9ae27?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(88, 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(89, 'https://images.unsplash.com/photo-1611602132416-da2045990f76?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(90, 'https://images.unsplash.com/photo-1612637968894-660373e23b03?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(91, 'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(92, 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(93, 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(94, 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(95, 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(96, 'https://images.unsplash.com/photo-1616137148650-6a6a91f03ef2?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(97, 'https://images.unsplash.com/photo-1617104678098-de229db51175?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(98, 'https://images.unsplash.com/photo-1617104424032-b9bd6972d0e4?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(99, 'https://images.unsplash.com/photo-1617850687395-620757feb1f3?w=800&h=600&fit=crop', 'exterior', 1, '外観'),
(100, 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&h=600&fit=crop', 'exterior', 1, '外観');

-- 内装画像 (interior) - 各施設に異なる画像
INSERT INTO facility_images (facility_id, image_url, image_type, sort_order, caption) VALUES
(1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(2, 'https://images.unsplash.com/photo-1618219740975-d40978bb7378?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(3, 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(4, 'https://images.unsplash.com/photo-1616137148650-6a6a91f03ef2?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(5, 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(6, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(7, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(8, 'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(9, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(10, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(11, 'https://images.unsplash.com/photo-1560185127-6a0c3d80fc68?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(12, 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(13, 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(14, 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(15, 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(16, 'https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(17, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(18, 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(19, 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(20, 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(21, 'https://images.unsplash.com/photo-1560184897-502a475f7a0d?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(22, 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(23, 'https://images.unsplash.com/photo-1489171078254-c3365d6e359f?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(24, 'https://images.unsplash.com/photo-1560185127-bdf4c6e37b40?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(25, 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(26, 'https://images.unsplash.com/photo-1560185127-9c7e7e1c4e9c?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(27, 'https://images.unsplash.com/photo-1560185127-d8c4e2e22c60?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(28, 'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(29, 'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(30, 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(31, 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(32, 'https://images.unsplash.com/photo-1560448076-fbc36d4fae44?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(33, 'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(34, 'https://images.unsplash.com/photo-1560185127-c8b73a22ad2f?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(35, 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(36, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(37, 'https://images.unsplash.com/photo-1560185127-6a0c3d80fc68?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(38, 'https://images.unsplash.com/photo-1560185009-5bf9f2849488?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(39, 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&h=600&fit=crop', 'interior', 2, '共用スペース'),
(40, 'https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=800&h=600&fit=crop', 'interior', 2, '共用スペース');

-- 居室画像 (room) - 上位40施設
INSERT INTO facility_images (facility_id, image_url, image_type, sort_order, caption) VALUES
(1, 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=600&fit=crop', 'room', 3, '居室'),
(2, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop', 'room', 3, '居室'),
(3, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop', 'room', 3, '居室'),
(4, 'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=800&h=600&fit=crop', 'room', 3, '居室'),
(5, 'https://images.unsplash.com/photo-1560448076-d05ebce8c2bc?w=800&h=600&fit=crop', 'room', 3, '居室'),
(6, 'https://images.unsplash.com/photo-1560185127-c8b73a22ad2f?w=800&h=600&fit=crop', 'room', 3, '居室'),
(7, 'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop', 'room', 3, '居室'),
(8, 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&h=600&fit=crop', 'room', 3, '居室'),
(9, 'https://images.unsplash.com/photo-1556909172-8c2f041fca1e?w=800&h=600&fit=crop', 'room', 3, '居室'),
(10, 'https://images.unsplash.com/photo-1560448076-fbc36d4fae44?w=800&h=600&fit=crop', 'room', 3, '居室'),
(11, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', 'room', 3, '居室'),
(12, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop', 'room', 3, '居室'),
(13, 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&h=600&fit=crop', 'room', 3, '居室'),
(14, 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=600&fit=crop', 'room', 3, '居室'),
(15, 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?w=800&h=600&fit=crop', 'room', 3, '居室'),
(16, 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop', 'room', 3, '居室'),
(17, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop', 'room', 3, '居室'),
(18, 'https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?w=800&h=600&fit=crop', 'room', 3, '居室'),
(19, 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop', 'room', 3, '居室'),
(20, 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&h=600&fit=crop', 'room', 3, '居室'),
(21, 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=600&fit=crop', 'room', 3, '居室'),
(22, 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&h=600&fit=crop', 'room', 3, '居室'),
(23, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop', 'room', 3, '居室'),
(24, 'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800&h=600&fit=crop', 'room', 3, '居室'),
(25, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop', 'room', 3, '居室'),
(26, 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&h=600&fit=crop', 'room', 3, '居室'),
(27, 'https://images.unsplash.com/photo-1616137148650-6a6a91f03ef2?w=800&h=600&fit=crop', 'room', 3, '居室'),
(28, 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=600&fit=crop', 'room', 3, '居室'),
(29, 'https://images.unsplash.com/photo-1618219740975-d40978bb7378?w=800&h=600&fit=crop', 'room', 3, '居室'),
(30, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop', 'room', 3, '居室'),
(31, 'https://images.unsplash.com/photo-1560185127-c8b73a22ad2f?w=800&h=600&fit=crop', 'room', 3, '居室'),
(32, 'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop', 'room', 3, '居室'),
(33, 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&h=600&fit=crop', 'room', 3, '居室'),
(34, 'https://images.unsplash.com/photo-1556909172-8c2f041fca1e?w=800&h=600&fit=crop', 'room', 3, '居室'),
(35, 'https://images.unsplash.com/photo-1560448076-fbc36d4fae44?w=800&h=600&fit=crop', 'room', 3, '居室'),
(36, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', 'room', 3, '居室'),
(37, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop', 'room', 3, '居室'),
(38, 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&h=600&fit=crop', 'room', 3, '居室'),
(39, 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=600&fit=crop', 'room', 3, '居室'),
(40, 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?w=800&h=600&fit=crop', 'room', 3, '居室');

-- 食堂画像 (dining) - 上位20施設
INSERT INTO facility_images (facility_id, image_url, image_type, sort_order, caption) VALUES
(1, 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(2, 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(3, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(4, 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(5, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(6, 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(7, 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(8, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(9, 'https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(10, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(11, 'https://images.unsplash.com/photo-1565895405138-6c3a1555da6a?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(12, 'https://images.unsplash.com/photo-1556742208-999815fca738?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(13, 'https://images.unsplash.com/photo-1556742077-0a6b6a4a4ac4?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(14, 'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(15, 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(16, 'https://images.unsplash.com/photo-1554679665-f5537f187268?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(17, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(18, 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(19, 'https://images.unsplash.com/photo-1564759224907-65b945ff0e84?w=800&h=600&fit=crop', 'dining', 4, '食堂'),
(20, 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop', 'dining', 4, '食堂');
