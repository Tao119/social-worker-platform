#!/bin/bash

# Geocode all facility addresses using Nominatim API
DB_URL="postgresql://social_worker_platform_user:OgwYQd0YWMrB8Yk0UaHuxYYB0imIcAx6@dpg-d5pnrivpm1nc73c5d760-a.oregon-postgres.render.com/social_worker_platform"

# Get all facilities
PGPASSWORD=OgwYQd0YWMrB8Yk0UaHuxYYB0imIcAx6 psql "$DB_URL" -t -A -c "SELECT id, address FROM facilities ORDER BY id;" | while IFS='|' read -r id address; do
  if [ -n "$id" ] && [ -n "$address" ]; then
    echo "Processing facility $id: $address"

    # URL encode the address
    encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$address'))")

    # Call Nominatim API
    result=$(curl -s "https://nominatim.openstreetmap.org/search?q=$encoded&format=json&limit=1&countrycodes=jp" \
      -H "User-Agent: MSWApp/1.0")

    # Extract lat/lon
    lat=$(echo "$result" | jq -r '.[0].lat // empty')
    lon=$(echo "$result" | jq -r '.[0].lon // empty')

    if [ -n "$lat" ] && [ -n "$lon" ]; then
      echo "  -> lat: $lat, lon: $lon"

      # Update database
      PGPASSWORD=OgwYQd0YWMrB8Yk0UaHuxYYB0imIcAx6 psql "$DB_URL" -c \
        "UPDATE facilities SET latitude = $lat, longitude = $lon WHERE id = $id;" 2>/dev/null
    else
      echo "  -> No coordinates found"
    fi

    # Respect Nominatim rate limit (1 request per second)
    sleep 1.1
  fi
done

echo "Done!"
