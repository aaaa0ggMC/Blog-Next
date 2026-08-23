#!/usr/bin/env bash
set -e
node "$(dirname "$0")/scripts/fastpush.mjs" "$@"
