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
			var hiliter = new JsHilite(IO.readFile(fileGroup.files[i].path), JsDoc.opt.e);
			IO.saveFile(context.d, file_srcname, hiliter.hilite());
		}
		fileGroup.files[i].source = file_srcname;
		allFiles[fileGroup.files[i].path] = true;
	}
	
	classfiles = {};
	for (var c in allClasses) {
		classfiles[c] = c+".html";
	}
	linkToType.classfiles = classfiles;
	
	for (var c in allClasses) {
		var output = classTemplate.process(allClasses[c]);
		IO.saveFile(context.d, classfiles[c], output);
	}
	
	output = classTemplate.process([globals]); // expects an array
	IO.saveFile(context.d, "globals.html", output);
	
	var output = indexTemplate.process(allClasses);
	IO.saveFile(context.d, "allclasses-frame.html", output);
	IO.copyFile(context.t+"index.html", context.d);
	IO.copyFile(context.t+"splash.html", context.d);
}

/**
	Takes a string of object types and adds links if there exists
	any documentation files in the output for that type.
	@param typeString Like "Foo" or "Foo[] | Bar".
 */
function linkToType(typeString) {
	var sep = /[^a-zA-Z0-9._$]+/;
	var types = typeString.split(sep);
	
	for (var i = 0; i < types.length; i++) {
		var link = linkToType.classfiles[types[i]];
		if (link) {
			var re = new RegExp('(^|[^a-zA-Z0-9._$])'+types[i]+'($|[^a-zA-Z0-9._$])');
			typeString = typeString.replace(re, "$1<a href=\""+link+"\">"+types[i]+"</a>$2", "g");
		}
	}
	
	return typeString;
}