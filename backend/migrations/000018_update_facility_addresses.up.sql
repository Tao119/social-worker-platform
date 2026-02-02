-- Update facilities with real Japanese addresses and coordinates

-- Update first 20 facilities with realistic Tokyo/Kanagawa area addresses
UPDATE facilities SET
    address = '東京都世田谷区北沢2-19-12',
    latitude = 35.6604,
    longitude = 139.6681
WHERE id = 1;

UPDATE facilities SET
    address = '東京都渋谷区神宮前4-32-13',
    latitude = 35.6702,
    longitude = 139.7070
WHERE id = 2;

UPDATE facilities SET
    address = '東京都新宿区西新宿1-26-2',
    latitude = 35.6896,
    longitude = 139.6987
WHERE id = 3;

UPDATE facilities SET
    address = '東京都港区芝公園4-2-8',
    latitude = 35.6567,
    longitude = 139.7477
WHERE id = 4;

UPDATE facilities SET
    address = '東京都品川区大崎1-11-2',
    latitude = 35.6198,
    longitude = 139.7284
WHERE id = 5;

UPDATE facilities SET
    address = '神奈川県横浜市中区本町6-50-1',
    latitude = 35.4480,
    longitude = 139.6325
WHERE id = 6;

UPDATE facilities SET
    address = '神奈川県川崎市川崎区駅前本町26-2',
    latitude = 35.5316,
    longitude = 139.7006
WHERE id = 7;

UPDATE facilities SET
    address = '東京都目黒区自由が丘1-29-3',
    latitude = 35.6072,
    longitude = 139.6690
WHERE id = 8;

UPDATE facilities SET
    address = '東京都杉並区高円寺南3-25-1',
    latitude = 35.7056,
    longitude = 139.6503
WHERE id = 9;

UPDATE facilities SET
    address = '東京都練馬区石神井町3-23-8',
    latitude = 35.7436,
    longitude = 139.6066
WHERE id = 10;

UPDATE facilities SET
    address = '東京都板橋区成増2-10-3',
    latitude = 35.7859,
    longitude = 139.6316
WHERE id = 11;

UPDATE facilities SET
    address = '東京都北区赤羽1-1-1',
    latitude = 35.7775,
    longitude = 139.7210
WHERE id = 12;

UPDATE facilities SET
    address = '東京都足立区千住3-92',
    latitude = 35.7491,
    longitude = 139.8046
WHERE id = 13;

UPDATE facilities SET
    address = '東京都江戸川区西葛西6-14-2',
    latitude = 35.6591,
    longitude = 139.8618
WHERE id = 14;

UPDATE facilities SET
    address = '神奈川県横浜市港北区日吉本町1-4-26',
    latitude = 35.5544,
    longitude = 139.6496
WHERE id = 15;

UPDATE facilities SET
    address = '神奈川県藤沢市藤沢545',
    latitude = 35.3382,
    longitude = 139.4877
WHERE id = 16;

UPDATE facilities SET
    address = '神奈川県相模原市南区相模大野3-1-33',
    latitude = 35.5323,
    longitude = 139.4382
WHERE id = 17;

UPDATE facilities SET
    address = '東京都調布市布田1-43-2',
    latitude = 35.6504,
    longitude = 139.5428
WHERE id = 18;

UPDATE facilities SET
    address = '東京都町田市原町田4-1-17',
    latitude = 35.5426,
    longitude = 139.4466
WHERE id = 19;

UPDATE facilities SET
    address = '東京都八王子市旭町12-1',
    latitude = 35.6558,
    longitude = 139.3389
WHERE id = 20;

-- Update remaining facilities with addresses if they exist
UPDATE facilities SET
    address = COALESCE(address, '東京都中野区中野4-1-1'),
    latitude = COALESCE(latitude, 35.7069),
    longitude = COALESCE(longitude, 139.6659)
WHERE id > 20 AND address IS NULL;
