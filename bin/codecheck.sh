#!/bin/sh

cat $* |
	sed -r \
		-e "s/(@(param|returns).*)([ \{])function/\1\3Function/" \
		-e "s/(@(param|returns).*)([ \{])([a-zA-Z0-9\.]+)\[\]/\1\3Array.\4/" \
		-e "s/(@(param|returns).*)([ \{])([a-zA-Z0-9\.]+)\[\]/\1\3Array.\4/" \
		-e "s/(@param.*\} )\[(.*)\]/\1\2/" \
		| closure-compiler.sh --warning_level VERBOSE --jscomp_off=globalThis --js_output_file /dev/null
