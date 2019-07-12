#!/bin/sh

# Recreate config file
rm -rf ./env-config.js
touch ./env-config.js

# Add assignment
echo "window._env_ = {" >> ./env-config.js

# Read each line in .env file
# Each line represents key=value pairs
while IFS="" read -r line
do
  echo "read from file: $line"
done < .env

echo "};" >> ./env-config.js
