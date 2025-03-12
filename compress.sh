#!/bin/bash

origin=".png"
destination=""

# String to replace
find "media/" -type f -not -name "*.webp" -print0  | while IFS= read -r -d '' file; do
    output="${file%.*}.webp"

    echo "$file => $output"
    cwebp "$file" -o "$output"
    
    #lqoutput="assets/${file%.*}-LQ.webp"
    #mkdir -p "$(dirname "$lqoutput")"
    #libwebp/bin/cwebp -resize 1200 0 "$file" -o "$lqoutput"
    rm "$file"
done
