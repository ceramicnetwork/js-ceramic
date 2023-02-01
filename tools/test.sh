#!/bin/bash

dir=$(cd $(dirname $BASH_SOURCE) && pwd)
echo $dir
cd $dir/../packages/cli/

#cas_url='https://cas-qa.3boxlabs.com/api/v0/requests'
cas_url='https://cas-dev.3boxlabs.com/api/v0/requests'
mode=$1
shift

wait_for_anchor() {
    streamid=$1
    anchorStatus='PENDING'
    while [[ "$anchorStatus" != "ANCHORED" ]]
    do
        sleep 1
        anchorStatus=$(./bin/ceramic.js state $streamid | jq -r .anchorStatus)
        echo "status $anchorStatus"
    done
}
request_anchor() {
    streamid=$1
    cid=$2
    echo "anchoring cid $cid"
    curl -X POST \
        -H 'Content-Type: application/json' \
        $cas_url \
        --data-binary "{\"cid\": \"$cid\", \"streamId\":\"$streamid\"}"
    echo
}

if [[ "$mode" == "create" ]]
then
    streamid=$(./bin/ceramic.js create tile --content '{"title":"My document"}' --only-genesis | grep StreamID | sed 's/StreamID(\(.*\))/\1/')

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

    request_anchor $streamid $cid
    wait_for_anchor $streamid

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

    request_anchor $streamid $cid
    wait_for_anchor $streamid

    exit 0
fi
if [[ "$mode" == "non-cid" ]]
then

    #cid=bagcqcera6hrv3zpbvfkyt5u5s5vvpt4nabg24lzdoxqkzfysrg2ajz3qo2zq
    streamid=$1
    cid=$2

    request_anchor $streamid $cid
    exit 0
fi

echo "Must specify mode"
exit 1
