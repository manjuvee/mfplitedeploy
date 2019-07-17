#!/bin/bash
if [ -p /dev/stdin ]; then
    while IFS= read line; do
        echo "Line: ${line}"
        SUBSTRING=$(echo $line| cut -c 17-22)
        echo $SUBSTRING 
    done
fi
