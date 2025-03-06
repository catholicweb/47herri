#!/bin/bash

# File containing the colon-separated data (name, id)
DATA_FILE="videos.txt"  # Change this to the path of your data file

# Loop through each line in the data file
while IFS=":" read -r name id; do
  # Clean up the name to remove extra spaces if any
  name=$(echo "$name" | xargs | tr '[:upper:]' '[:lower:]')

  # Create a markdown file with the name
  output_file="${name}.md"

  # Write the YAML front matter and the video ID into the file
  echo -e "---\nlayout: parroquia\ntitle: $name\nvideo: $id\n---\n" > "$output_file"

  echo "Created file: $output_file"

done < "$DATA_FILE"
