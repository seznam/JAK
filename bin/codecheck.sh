#!/bin/sh

echo "/** @suppress {duplicate} */var JAK; var JSON,console,history,localStorage,VBS_getByte,VBS_getLength;" |
cat - $* |
	sed -r \
		-e "s/(@(param|returns).*)([ \{])function/\1\3Function/" \
		-e "s/(@(param|returns).*)([ \{])object/\1\3Object/" \
		-e "s/(@(param|returns).*)([ \{])event(.*\})/\1\3Event\4/" \
		-e "s/(@(param|returns).*)([ \{])node(.*\})/\1\3Node\4/" \
		-e "s/(@(param|returns).*)([ \{])array(.*\})/\1\3Array\4/" \
		-e "s/(@(param|returns).*)([ \{])integer/\1\3number/" \
		-e "s/(@(param|returns).*)([ \{])int([ \}])/\1\3number\4/" \
		-e "s/(@(param|returns).*)([ \{])float/\1\3number/" \
		-e "s/(@(param|returns).*)([ \{])bool([| \}])/\1\3boolean\4/" \
		-e "s/(@(param|returns).*)([ \{])([a-zA-Z0-9\.]+)\[\]/\1\3Array.<\4>/" \
		-e "s/(@(param|returns).*)([ \{])([a-zA-Z0-9\.]+)\[\]/\1\3Array.<\4>/" \
		-e "s/(@param \{(.*))\} \[(.*)\]/\1=} \3/" \
		-e "s/(@class.*)/\1\n@constructor/" \
		| closure-compiler.sh --warning_level VERBOSE --jscomp_off=globalThis --jscomp_off=duplicate --jscomp_off=missingProperties --js_output_file /dev/null 2>&1 
