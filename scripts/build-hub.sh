#!/bin/sh
rm -f hub/*.js
npx tsc src/hub/*.ts --outDir hub --module commonjs --target ESNext --esModuleInterop