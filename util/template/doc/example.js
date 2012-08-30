console.DEBUG = 1;

var template = "<p>{{title}}</p><ul> \
	{{#people}} \
	<li>{{name}}</li> \
	{{/people}} \
</ul>";

var t = new JAK.Template(template);

var data = {
	title: "Lidi",
	people: [
		{name:"A"},
		{name:"B"},
		{name:"C"}
	]
}

document.body.innerHTML = t.render(data);
