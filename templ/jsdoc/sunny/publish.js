require("app/JsHilite.js");

function basename(filename) {
	filename.match(/([^\/\\]+)\.[^\/\\]+$/);
	return RegExp.$1;
}

function publish(fileGroup, context) {
	var classTemplate = new JsPlate(context.t+"class.tmpl");
	var indexTemplate = new JsPlate(context.t+"index.tmpl");
	
	var allFiles = {};
	var allClasses = {};
	var globals = {methods:[], properties:[], alias:"GLOBALS", isStatic:true};
	
	for (var i = 0; i < fileGroup.files.length; i++) {
		var file_basename = basename(fileGroup.files[i].filename);
		var file_srcname = file_basename+".src.html";
		
		for (var s = 0; s < fileGroup.files[i].symbols.length; s++) {
			if (fileGroup.files[i].symbols[s].isa == "CONSTRUCTOR") {
				var thisClass = fileGroup.files[i].symbols[s];
				// sort inherited methods by class
				var inheritedMethods = fileGroup.files[i].symbols[s].getInheritedMethods();
				if (inheritedMethods.length > 0) {
					thisClass.inherited = {};
					for (var n = 0; n < inheritedMethods.length; n++) {
						if (! thisClass.inherited[inheritedMethods[n].memberof]) thisClass.inherited[inheritedMethods[n].memberof] = [];
						thisClass.inherited[inheritedMethods[n].memberof].push(inheritedMethods[n]);
					}
				}
				
				thisClass.name = fileGroup.files[i].symbols[s].alias;
				thisClass.source = file_srcname;
				thisClass.filename = fileGroup.files[i].filename;
				thisClass.docs = thisClass.name+".html";
				
				if (!allClasses[thisClass.name]) allClasses[thisClass.name] = [];
				allClasses[thisClass.name].push(thisClass);
			}
			else if (fileGroup.files[i].symbols[s].alias == fileGroup.files[i].symbols[s].name) {
				if (fileGroup.files[i].symbols[s].isa == "FUNCTION") {
					globals.methods.push(fileGroup.files[i].symbols[s]);
				}
				else {
					globals.properties.push(fileGroup.files[i].symbols[s]);
				}
			}
		}
		
		if (!allFiles[fileGroup.files[i].path]) {
			var hiliter = new JsHilite(IO.readFile(fileGroup.files[i].path));
			IO.saveFile(context.d, file_srcname, hiliter.hilite());
		}
		fileGroup.files[i].source = file_srcname;
		allFiles[fileGroup.files[i].path] = true;
	}
	
	for (var c in allClasses) {
		outfile = c+".html";
		allClasses[c].outfile = outfile;
		var output = classTemplate.process(allClasses[c]);
		IO.saveFile(context.d, outfile, output);
	}
	
	output = classTemplate.process([globals]);
	IO.saveFile(context.d, "globals.html", output);
	
	var output = indexTemplate.process(allClasses);
	IO.saveFile(context.d, "allclasses-frame.html", output);
	IO.copyFile(context.t+"index.html", context.d);
	IO.copyFile(context.t+"splash.html", context.d);
}
