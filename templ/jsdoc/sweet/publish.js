require("app/JsHilite.js");

function publish(fileGroup, context) {
	var file_template = new JsPlate(context.t+"file.tmpl");
	
	// build up classname to file mapping
	var index = {};
	linkToType.classfiles = {};
	for (var i = 0; i < fileGroup.files.length; i++) {
		if (context.d) {
			var our_name = generateFilename(i);
			index[our_name] = {name: (fileGroup.files[i].filename), classes: []};
		
			for (var s = 0; s < fileGroup.files[i].symbols.length; s++) {
				if (fileGroup.files[i].symbols[s].isa == "CONSTRUCTOR") {
					index[our_name].classes.push(fileGroup.files[i].symbols[s].alias);
					if (our_name) linkToType.classfiles[fileGroup.files[i].symbols[s].alias] = our_name;
//					//fileGroup.classfiles[fileGroup.files[i].symbols[s].alias] = our_name;
				}
			}	
	
			// make copy original source code with syntax hiliting
			var sourceFile = fileGroup.files[i].path;
			if (sourceFile) {
				var hiliter = new JsHilite(IO.readFile(sourceFile), JsDoc.opt.e);
				IO.saveFile(context.d, "src"+our_name, hiliter.hilite());
				
				fileGroup.files[i].source = "src"+our_name;
			}
		}
	}
	
	for (var i = 0; i < fileGroup.files.length; i++) {
		if (context.d) {
			var output = file_template.process(fileGroup.files[i]);
			IO.saveFile(context.d, generateFilename(i), output);
		}
	}
	
	var indx_template = new JsPlate(context.t+"index.tmpl");
	var index = indx_template.process(index);
	if (context.d) {
		IO.saveFile(context.d, "file_list.html", index);
		
		IO.copyFile(context.t+"index.html", context.d);
		IO.copyFile(context.t+"splash.html", context.d);
		IO.copyFile(context.t+"default.css", context.d);
		
		IO.copyFile(context.t+"file.gif", context.d);
		IO.copyFile(context.t+"overview.gif", context.d);
		IO.copyFile(context.t+"constructor.gif", context.d);
		IO.copyFile(context.t+"function.gif", context.d);
		IO.copyFile(context.t+"object.gif", context.d);
	}
}

function generateFilename(i) {
	return "_"+((i+1<10)?"0"+(i+1):(i+1))+".html"
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
			typeString = typeString.replace(re, "$1<a href=\""+link+"#"+types[i]+"\">"+types[i]+"</a>$2", "g");
		}
	}
	
	return typeString;
}