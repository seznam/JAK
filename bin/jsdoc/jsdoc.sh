#!/bin/sh

##################################
#                                #
#   JSDOC runnig script          #
#                                #
##################################

# nastaveni locales
LOC="LC_ALL=\"cs_CZ.utf8\""

# cesta k aplikaci
DOC_DIR="/www/util/jsdoc"

echo "JSDOC start"
echo

#vlastni volani jsdoc
env $LOC java -Djsdoc.dir="$DOC_DIR" -jar "$DOC_DIR/app/js.jar" "$DOC_DIR/app/run.js" $*

echo
