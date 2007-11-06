require("app/Dumper.js");

function publish(fileGroup, context) {
	var file_template = new JsPlate(context.t+"file.tmpl");
	
	var output = file_template.process(fileGroup);

	if (context.d) {
		IO.saveFile(context.d, "jsdoc.xml", output);
	}
}