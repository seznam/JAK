#!/bin/sh
#
# $Id$
#
# Debian packaging script.
#

DEB_PCK_NAME=szn-jsdoc
MAINTAINER='Petr Dolezal <petr.dolezal@firma.seznam.cz>'
DEBIAN_BASE=tmp/$DEB_PCK_NAME
PROJECT_DIR=/www/utils/jsdoc
RUN_BASE=/usr/bin
WORK_DIR=$DEBIAN_BASE$PROJECT_DIR 
RUN_DIR=$DEBIAN_BASE$RUN_BASE

# create directories
rm -r $DEBIAN_BASE 2>/dev/null
mkdir -p $WORK_DIR/app
mkdir -p $WORK_DIR/templates
mkdir -p $RUN_DIR
mkdir -m 0755 -p $DEBIAN_BASE/DEBIAN

# copy data
cp ../src/jsdoc/* $WORK_DIR/app
cp ../templ/jsdoc/* $WORK_DIR/templates
cp ../bin/jsdoc/jsdoc.sh $RUN_DIR/jsdoc

# change ownership and user rights
chown -R nobody.nogroup $WORK_DIR/*

# debian package control files
for f in preinst postinst conffiles prerm postrm; do
    if [ -f  $DEB_PCK_NAME.$f ]; then
        cp $DEB_PCK_NAME.$f $DEBIAN_BASE/DEBIAN/$f
    fi
done

`find $DEBIAN_BASE -path "*CVS*" | xargs rm -R $f 2>/dev/null`
`find $DEBIAN_BASE -type f | grep -v "DEBIAN" | xargs md5sum | sed -e "s/tmp\/$DEB_PCK_NAME//" >> $DEBIAN_BASE/DEBIAN/md5sum`

SIZEDU=`du -sk "$DEBIAN_BASE" | awk '{ print $1}'`
SIZEDIR=`find "$DEBIAN_BASE" -type d | wc | awk '{print $1}'`
SIZE=$[ $SIZEDU - $SIZEDIR ]

VERSION=`cat "$DEB_PCK_NAME".version`
sed -e "s/__VERSION__/$VERSION/" \
    -e "s/__PACKAGE__/$DEB_PCK_NAME/" \
    -e "s/__MAINTAINER__/$MAINTAINER/" \
    -e "s/__SIZE__/$SIZE/" \
    $DEB_PCK_NAME.control > tmp/$DEB_PCK_NAME/DEBIAN/control


# Vytvori a prejmenuje balicek
dpkg --build $DEBIAN_BASE
dpkg-name -o $DEBIAN_BASE.deb
rm -r $DEBIAN_BASE
