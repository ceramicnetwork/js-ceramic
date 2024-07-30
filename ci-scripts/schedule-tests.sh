#!/bin/bash

id=$(uuidgen)
job_id=$(uuidgen)
# Schedule tests for 15 minutes in the future to allow the network to stabilize. This assumes that the deployment is
# successful with the right image being deployed, which might not always be the case if the deployment fails for some
# reason. In the future, this can be done better via the CD manager, which will check for the network being ready with
# the right image before scheduling tests.
now=$(date +%s%N -d "15 minutes")
ttl=$(date +%s -d "14 days")
network=${1-dev}
test_selector=${2-.}

docker run --rm -i \
  -e "AWS_REGION=$AWS_REGION" \
  -e "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" \
  -e "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" \
  -v ~/.aws:/root/.aws \
  -v "$PWD":/aws \
  amazon/aws-cli dynamodb put-item --table-name "ceramic-$network-ops" --item \
  "{                                                        \
    \"id\":     {\"S\": \"$id\"},                           \
    \"job\":    {\"S\": \"$job_id\"},                       \
    \"ts\":     {\"N\": \"$now\"},                          \
    \"ttl\":    {\"N\": \"$ttl\"},                          \
    \"stage\":  {\"S\": \"queued\"},                        \
    \"type\":   {\"S\": \"workflow\"},                      \
    \"params\": {                                           \
      \"M\": {                                              \
        \"name\":     {\"S\": \"Post-Deployment Tests\"},   \
        \"org\":      {\"S\": \"3box\"},                    \
        \"repo\":     {\"S\": \"ceramic-tests\"},           \
        \"ref\":      {\"S\": \"main\"},                    \
        \"workflow\": {\"S\": \"run-durable.yml\"},         \
        \"labels\":   {\"L\": [{\"S\": \"test\"}]},         \
        \"inputs\":   {                                     \
          \"M\": {                                          \
            \"test_selector\": {\"S\": \"$test_selector\"}  \
          }                                                 \
        }                                                   \
      }                                                     \
    }                                                       \
  }"
