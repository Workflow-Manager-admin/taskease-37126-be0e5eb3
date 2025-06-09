#!/bin/bash
cd /home/kavia/workspace/code-generation/taskease-37126-be0e5eb3/taskease
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

