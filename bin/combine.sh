#!/bin/bash

PWD=$(pwd)

yarn run soljitsu combine --src-dir="$PWD"/contracts --dest-dir="$PWD"/build/combined && \

echo "Combined copying done!"