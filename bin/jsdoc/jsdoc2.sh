#!/bin/sh

# cesta k aplikaci
DOC_DIR="/www/util/jsdoc2"

echo "jsdoc_toolkit 2.x starting"
echo

#vlastni volani jsdoc
java -jar "$DOC_DIR/jsrun.jar" "$DOC_DIR/app/run.js" -t=/www/util/jsdoc2/templates/szn/ -d=out -v $*

echo
