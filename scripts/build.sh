#!/bin/sh
sh scripts/clean.sh
node scripts/build-meta.mjs
echo "running src"
npx tsc
echo ""
node scripts/build-rollup.mjs