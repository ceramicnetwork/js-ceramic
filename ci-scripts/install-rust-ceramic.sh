#!/usr/bin/env bash

REPO=ceramicnetwork/rust-ceramic/releases
ARCH=x86_64
OS=unknown-linux-gnu
TARGET=$ARCH-$OS

if [ -z ${1+x} ] || [ "$1" == "latest" ]; then
  VERSION=$(curl https://api.github.com/repos/$REPO/latest -s |  jq .name -r)
else
  VERSION="v"$1
fi
NAME=ceramic-one
TAR_NAME=${NAME}_$TARGET.tar.gz
DEB_NAME=${NAME}.deb
OUTPUT_FILE=$NAME.tar.gz
DOWNLOAD_URL=https://github.com/$REPO/download/$VERSION/$TAR_NAME

echo "Downloading "$DOWNLOAD_URL" to "$OUTPUT_FILE

curl -LJ0 --output $OUTPUT_FILE $DOWNLOAD_URL

echo "Extracting "$OUTPUT_FILE
tar -xvf $OUTPUT_FILE
rm $OUTPUT_FILE

DEBIAN_FRONTEND=noninteractive dpkg -i $DEB_NAME
