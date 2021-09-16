#!/bin/bash

TAGS=""
for IMAGE_ID in $2
do
  for TAG in $3
  do
    TAGS="$TAGS --tag $IMAGE_ID:$TAG"
  done
done

echo "$1"
echo "$2"
echo "$TAGS"

docker buildx build . --file "$1" --output 'type=image,push=true' "$TAGS"
