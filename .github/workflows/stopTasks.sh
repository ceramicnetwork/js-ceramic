#!/bin/bash

TASK_IDS=$(aws ecs list-tasks --cluster $1 --service $2 | grep "task/" | sed -E 's/.*task\/(.*\/[a-zA-Z0-9]*)(.*)/\1/' | tr '\n' ' ')
echo "Task Ids: ${TASK_IDS}"
for t in ${TASK_IDS[@]}; do
    if [[ $t ]]; then
    echo "Stopping task $t"
    aws ecs stop-task --cluster $1 --task $t
    fi
done