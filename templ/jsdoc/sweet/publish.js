require("app/JsHilite.js");

function publish(fileGroup, context) {
	var file_template = new JsPlate(context.t+"file.tmpl");
	
	var index = {};
	for (var i = 0; i < fileGroup.files.length; i++) {
		if (context.d) {
			var our_name = "_"+((i+1<10)?"0"+(i+1):(i+1))+".html";
			index[our_name] = {name: (fileGroup.files[i].filename), classes: []};
		
			for (var s = 0; s < fileGroup.files[i].symbols.length; s++) {
				if (fileGroup.files[i].symbols[s].isa == "CONSTRUCTOR") {
					index[our_name].classes.push(fileGroup.files[i].symbols[s].alias);
				}
			}	
			
			// make copy original source code with syntax hiliting
			var sourceFile = fileGroup.files[i].path;
			if (sourceFile) {
				var hiliter = new JsHilite(IO.readFile(sourceFile));
				IO.saveFile(context.d, "src"+our_name, hiliter.hilite());
				
				fileGroup.files[i].source = "src"+our_name;
			}
			
			var output = file_template.process(fileGroup.files[i]);
			IO.saveFile(context.d, our_name, output);
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