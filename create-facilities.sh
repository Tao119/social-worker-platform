#!/bin/bash

# Get admin token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r .token)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to get admin token"
  exit 1
fi

echo "Admin token obtained successfully"
echo "Creating 100 facilities..."

# 施設の種類
FACILITY_TYPES=("介護老人保健施設" "特別養護老人ホーム" "有料老人ホーム" "グループホーム" "サービス付き高齢者向け住宅")

# 地域
AREAS=("東京都" "神奈川県" "埼玉県" "千葉県" "大阪府" "京都府" "兵庫県" "愛知県" "福岡県" "北海道")

# 受け入れ条件のバリエーション
CONDITIONS=(
  "要介護1以上、医療ケア対応可能"
  "要介護2以上、認知症対応可能"
  "要介護3以上、24時間看護体制"
  "要支援1以上、リハビリ対応"
  "要介護1以上、看取り対応可能"
  "要介護2以上、胃ろう・経管栄養対応"
  "要介護1以上、インスリン注射対応"
  "要介護3以上、人工透析対応可能"
  "要支援2以上、認知症専門ケア"
  "要介護1以上、ターミナルケア対応"
)

for i in $(seq 1 100); do
  # パディングされた番号（001, 002, ...）
  PADDED=$(printf "%03d" $i)
  
  # ランダムな施設タイプ
  TYPE_INDEX=$((i % ${#FACILITY_TYPES[@]}))
  FACILITY_TYPE="${FACILITY_TYPES[$TYPE_INDEX]}"
  
  # ランダムな地域
  AREA_INDEX=$((i % ${#AREAS[@]}))
  AREA="${AREAS[$AREA_INDEX]}"
  
  # ランダムな受け入れ条件
  COND_INDEX=$((i % ${#CONDITIONS[@]}))
  CONDITION="${CONDITIONS[$COND_INDEX]}"
  
  # 病床数（10-100の範囲でランダム）
  BED_CAPACITY=$((10 + (i * 7) % 91))
  
  # 住所
  ADDRESS="${AREA}${FACILITY_TYPE}地区${i}-${i}-${i}"
  
  EMAIL="info@facility${PADDED}.com"
  PASSWORD="facility${PADDED}"
  NAME="${FACILITY_TYPE} ${PADDED}号"
  PHONE="0900000${PADDED}"
  
  echo -n "Creating facility $i/100: $NAME ... "
  
  RESPONSE=$(curl -s -X POST http://localhost:8080/api/admin/facilities \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{
      \"email\": \"$EMAIL\",
      \"password\": \"$PASSWORD\",
      \"name\": \"$NAME\",
      \"address\": \"$ADDRESS\",
      \"phone\": \"$PHONE\",
      \"bed_capacity\": $BED_CAPACITY,
      \"acceptance_conditions\": \"$CONDITION\"
    }")
  
  if echo "$RESPONSE" | jq -e '.facility.id' > /dev/null 2>&1; then
    echo "✓ Success (ID: $(echo $RESPONSE | jq -r .facility.id))"
  else
    echo "✗ Failed: $(echo $RESPONSE | jq -r .error)"
  fi
  
  # APIレート制限を避けるため少し待機
  sleep 0.1
done

echo ""
echo "Facility creation completed!"
echo ""
echo "Sample login credentials:"
echo "  Email: info@facility001.com"
echo "  Password: facility001"
echo ""
echo "  Email: info@facility050.com"
echo "  Password: facility050"
echo ""
echo "  Email: info@facility100.com"
echo "  Password: facility100"
