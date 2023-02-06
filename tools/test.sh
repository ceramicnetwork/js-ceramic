#!/bin/bash

dir=$(cd $(dirname $BASH_SOURCE) && pwd)
echo $dir
cd $dir/../packages/cli/

cas_url='https://cas.3boxlabs.com/api/v0/requests'
#cas_url='https://cas-clay.3boxlabs.com/api/v0/requests'
#cas_url='https://cas-qa.3boxlabs.com/api/v0/requests'
#cas_url='https://cas-dev.3boxlabs.com/api/v0/requests'
mode=$1
shift


pick_anchors() {
    init=$1
    update=$2

    echo -n "What should be anchored (none/init/update/all)?: "
    read anchor
    echo
    case $anchor in
    none)
        cids=()
      ;;
    init)
        cids=($init)
        ;;
    update)
        cids=($update)
        ;;
    all)
        cids=($init $update)
        ;;
    *)
        pick_anchors
        ;;
    esac
}
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

do_anchors() {
    streamid=$1

    ./bin/ceramic.js update $streamid --content '{ "Title": "My updated document" }' --no-anchor > /dev/null

    init=$(./bin/ceramic.js state $streamid | jq -r .log[0].cid)
    update=$(./bin/ceramic.js state $streamid | jq -r .log[1].cid)

    echo "init: $init update: $update"

    pick_anchors $init $update

    for cid in "${cids[@]}"
    do
        request_anchor $streamid $cid
    done
    if (( ${#cids[@]} != 0 ))
    then
        wait_for_anchor $streamid
    fi
}

case $mode in
    create)
    streamid=$(./bin/ceramic.js create tile --content '{"title":"My document"}' --only-genesis | grep StreamID | sed 's/StreamID(\(.*\))/\1/')

    echo "Created stream $streamid"

    do_anchors $streamid
    ;;
pin)
    echo -n "Stream ID to pin: "
    read streamid
    echo

    ./bin/ceramic.js pin add $streamid > /dev/null

    echo "Pinned stream $streamid"

    do_anchors $streamid
    ;;
anchor)
    streamid=$1
    cid=$2

    request_anchor $streamid $cid
    ;;
spam)
    streamid=$(./bin/ceramic.js create tile --content '{"title":"My document"}' | grep StreamID | sed 's/StreamID(\(.*\))/\1/')
    ./bin/ceramic.js update $streamid --content '{ "Title": "My updated document" }' --no-anchor
    update=$(./bin/ceramic.js state $streamid | jq -r .log[1].cid)

    for j in {0..110}
    do
        request_anchor $streamid $update
    done
    ;;
*)
    echo "Specify mode as one of: create,pin,anchor"
    exit 1
esac

