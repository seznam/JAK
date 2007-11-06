
try {
	importClass(java.lang.System);
}
catch (e) {
	throw "RuntimeException: The class java.lang.System is required to run this script.";
}

var __DIR__ = (System.getProperty("jsdoc.dir")||System.getProperty("user.dir"))+Packages.java.io.File.separator;

/** Load required libraries. */
function require(lib) {
	var libDirs = ['', __DIR__, __DIR__+'app/', __DIR__+'../'];
	var libErrors = [];
	for(var i = 0; i < libDirs.length; i++) {
		try {
			var file = new Packages.java.io.File(libDirs[i]+lib);
			if(!file.exists()) {
				libErrors.push('Could not find: ['+(libDirs[i]+lib)+']');
			}
			else {
				print("Loading: ["+(libDirs[i]+lib)+"] ...");
				load(libDirs[i]+lib);
				return;
			}
		}
		catch (e) {
			libErrors.push('Error loading: ['+(libDirs[i]+lib)+']');
		}
	}
	for(var i=0; i < libErrors.length; i++) {
		print("ERROR: ["+libErrors[i]+"]");
	}
	quit();
}

require("app/JsDoc.js");
require("app/Util.js");
require("app/JsIO.js");
require("app/Symbol.js");
require("app/JsToke.js");
require("app/JsParse.js");
require("app/DocTag.js");
require("app/Doclet.js");
require("app/DocFile.js");
require("app/JsPlate.js");

/** The main function. Called automatically. */
function Main() {
	if (JsDoc.opt.o) LOG.out = IO.open(JsDoc.opt.o, true);
	if (JsDoc.opt.c) {
		eval('conf = '+IO.readFile(JsDoc.opt.c));
		for (var c in conf) {
			JsDoc.opt[c] = conf[c];
		}
	}
	if (JsDoc.opt.h || JsDoc.opt._.length == 0 || JsDoc.opt.t == "") JsDoc.usage();
	
	var ext = ["js"];
	if (JsDoc.opt.x) ext = JsDoc.opt.x.split(",").map(function(x) {return x.toLowerCase()});

	if (typeof(JsDoc.opt.r) == "boolean") JsDoc.opt.r = 10;
	else if (!isNaN(parseInt(JsDoc.opt.r))) JsDoc.opt.r = parseInt(JsDoc.opt.r);
	else JsDoc.opt.r = 1;
		
	if (JsDoc.opt.d === true || JsDoc.opt.t === true) { // like when a user enters: -d mydir
		LOG.warn("Option malformed.");
		JsDoc.usage();
	}
	else if (!JsDoc.opt.d) {
		JsDoc.opt.d = "js_docs_out";
	}

	JsDoc.opt.d += (JsDoc.opt.d.indexOf(IO.FileSeparator) == JsDoc.opt.d.length-1)?
		"" : IO.FileSeparator;
	LOG.inform("Creating output directory: "+JsDoc.opt.d);
	IO.makeDir(JsDoc.opt.d);
	
	LOG.inform("Scanning for source files: recursion set to "+JsDoc.opt.r+" subdir"+((JsDoc.opt.r==1)?"":"s")+".");
	function isJs(element, index, array) {
		var thisExt = element.split(".").pop().toLowerCase();
		return (ext.indexOf(thisExt) > -1); // we're only interested in files with certain extensions
	}
	var srcFiles = [];
	for (var d = 0; d < JsDoc.opt._.length; d++) {
		srcFiles = srcFiles.concat(
			IO.ls(JsDoc.opt._[d], JsDoc.opt.r).filter(isJs)
		);
	}
	
	LOG.inform(srcFiles.length+" source file"+((srcFiles ==1)?"":"s")+" found:\n\t"+srcFiles.join("\n\t"));
	var fileGroup = JsDoc.parse(srcFiles, JsDoc.opt);
	
	if (JsDoc.opt.D) {
		var defines = {};
		for (var i = 0; i < JsDoc.opt.D.length; i++) {
			var defineParts = JsDoc.opt.D[i].split(":", 2);
			defines[defineParts[0]] = defineParts[1];
		}
		JsDoc.opt.D = defines;
	}
	
	if (JsDoc.opt.t && IO.exists(JsDoc.opt.t)) {
		JsDoc.opt.t += (JsDoc.opt.t.indexOf(IO.FileSeparator)==JsDoc.opt.t.length-1)?
			"" : IO.FileSeparator;
		LOG.inform("Loading template: "+JsDoc.opt.t+"publish.js");
		require(JsDoc.opt.t+"publish.js");
		
		LOG.inform("Publishing all files...");
		publish(fileGroup, JsDoc.opt);
		LOG.inform("Finished.");
	}
	
	if (LOG.out) LOG.out.close();
}

JsDoc.opt = Util.getOptions(arguments, {d:'directory', t:'template', r:'recurse', x:'ext', p:'private', a:'allfunctions', A:'Allfunctions', o:'out', h:'help', 'D[]':'define'});
Main();