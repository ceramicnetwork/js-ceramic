#!/bin/bash

dir=$(cd $(dirname $BASH_SOURCE) && pwd)
echo $dir
cd $dir/../packages/cli/

mode=$1

wait_for_anchor() {
    anchorStatus='PENDING'
    while [[ "$anchorStatus" != "ANCHORED" ]]
    do
        sleep 1
        anchorStatus=$(./bin/ceramic.js state $streamid | jq -r .anchorStatus)
        echo "status $anchorStatus"
    done
}

if [[ "$mode" == "create" ]]
then
    streamid=$(./bin/ceramic.js create tile --content '{"title":"My document"}' | grep StreamID | sed 's/StreamID(\(.*\))/\1/')

    echo "Created stream $streamid"

    ./bin/ceramic.js update $streamid --content '{ "Title": "My updated document" }' --no-anchor true

    init=$(./bin/ceramic.js state $streamid | jq -r .log[0].cid)
    update=$(./bin/ceramic.js state $streamid | jq -r .log[1].cid)

    echo "$init $update"

    echo -n "What should be anchored (none/init/update)?: "
    read anchor
    echo
    if [[ $anchor == "none" ]]
    then
        exit 0
    fi
    if [[ $anchor == "init" ]]
    then
        cid=$init
    fi
    if [[ $anchor == "update" ]]
    then
        cid=$update
    fi

    echo "anchoring cid $cid"
    curl -X POST \
        -H 'Content-Type: application/json'\
        https://cas-qa.3boxlabs.com/api/v0/requests \
        --data-binary "{\"cid\": \"$cid\", \"streamId\":\"$streamid\"}"
    echo

    wait_for_anchor
    exit 0
fi
if [[ "$mode" == "pin" ]]
then

    echo -n "Stream ID to pin: "
    read streamid
    echo

    ./bin/ceramic.js pin add $streamid

    init=$(./bin/ceramic.js state $streamid | jq -r .log[0].cid)
    update=$(./bin/ceramic.js state $streamid | jq -r .log[1].cid)

    echo "$init $update"

    echo -n "What should be anchored (none/init/update)?: "
    read anchor
    echo
    if [[ $anchor == "none" ]]
    then
        exit 0
    fi
    if [[ $anchor == "init" ]]
    then
        cid=$init
    fi
    if [[ $anchor == "update" ]]
    then
        cid=$update
    fi

    echo "anchoring cid $cid"
    curl -X POST \
        -H 'Content-Type: application/json'\
        https://cas-qa.3boxlabs.com/api/v0/requests \
        --data-binary "{\"cid\": \"$cid\", \"streamId\":\"$streamid\"}"
    echo

    wait_for_anchor
    exit 0
fi

echo "Must specify mode"
exit 1
