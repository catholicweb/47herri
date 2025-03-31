#!/bin/bash

# Set the root directory for your media folder
MEDIA_DIR="media"

# Find all image files in the 'media' folder (jpg, png, jpeg, gif)
find "$MEDIA_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" \) | while read -r img; do
    # Get the original file's extension
    EXT="${img##*.}"
    
    # Create the new file name with .webp extension
    NEW_IMG="${img%.$EXT}.webp"

    # Convert the image to .webp using cwebp
    cwebp "$img" -o "$NEW_IMG"
    
    # If the conversion is successful, replace the original references
    if [ $? -eq 0 ]; then
        echo "Converted $img to $NEW_IMG"    
        # Find and replace occurrences of the original filename with the new .webp filename in all files
        find . -type f \( -iname "*.html" -o -iname "*.md" -o -iname "*.txt" \) -print0 | xargs -0 sed -i "s|$img|$NEW_IMG|g"
        rm "$img"
    else
        echo "Failed to convert $img"
    fi
done