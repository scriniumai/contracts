#!/bin/bash

PWD=$(pwd)

JSON_BIN="./node_modules/.bin/json"
ACCOUNTS=$(cat "$PWD/data/ganache-cli-accounts.json")
ACCOUNTS_IDXS=$(echo $ACCOUNTS | $JSON_BIN -ak)

ACCOUNTS_ARG=""

for IDX in $ACCOUNTS_IDXS; do
  KEY=$(echo $ACCOUNTS | $JSON_BIN $IDX.0)
  ADDRESS=$(echo $ACCOUNTS | $JSON_BIN $IDX.1)
  ACCOUNTS_ARG=$ACCOUNTS_ARG"--account=$KEY,1000000000000000000000 --unlock $ADDRESS "
done

echo $ACCOUNTS_ARG

if [ -z "$HOST" ]; then
  HOSTNAME_ARG="--hostname 0.0.0.0"
else
  HOSTNAME_ARG="--hostname ${HOST}"
fi

if [ -z "$PORT" ]; then
  PORT_ARG="--port 8545"
else
  PORT_ARG="--port ${PORT}"
fi

if [ -z "$NETWORK_ID" ]; then
  NETWORK_ID_ARG="--networkId 5777"
else
  NETWORK_ID_ARG="--networkId ${NETWORK_ID}"
fi

yarn run ganache-cli  \
  $HOSTNAME_ARG \
  $NETWORK_ID_ARG \
  $PORT_ARG \
  $ACCOUNTS_ARG
