/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Console + Shell + Commands
 * @version 2.0
 * @author Zara
 */ 


 /* ----------------- console: vizualni obal shellu ----------------- */

/**
 * @class Console - vizualni obal shellu
 * @group jak-utils
 */ 
JAK.Console = JAK.ClassMaker.makeClass({
	NAME: "JAK.Console",
	VERSION: "2.0"
});

/**
 * @static
 * automaticka tvorba instance console
 */ 
JAK.Console.onDomReady = function() {
	JAK.console = new JAK.Console();
}
JAK.Events.onDomReady(JAK.Console, "onDomReady");

JAK.Console.prototype.$constructor = function() {
	this.ec = []
	this.dom = {
		container: JAK.mel("div", {className:"console-container"}, {position:"absolute"}),
		input: JAK.mel("input", {className:"console-input"}),
		output: JAK.mel("div", {className:"console-output"}, {overflow:"auto"}),
		prompt: JAK.mel("span", {className:"console-prompt"})
	}
	
	this.left = 0;
	this.top = 0;
	this.width = 500;
	this.height = 300;
	this.state = true;
	this.moving = "";
	this.cookieName = "console";
	
	
	JAK.DOM.append([this.dom.container, this.dom.output, this.dom.prompt, this.dom.input]);
	this._buildControl();

	document.body.insertBefore(this.dom.container, document.body.firstChild);
	
	this.dom.input.focus();
	this.ec.push(JAK.Events.addListener(window, "scroll", this, "_scroll", false, true));
	
	this._load();

	this.switchTo(this.state);
	this._restyle();
	
	this.shell = new JAK.Shell(this);
	this.ec.push(JAK.Events.addListener(this.dom.input, "keyup", this, "_keyup", false, true));
	this.ec.push(JAK.Events.addListener(this.dom.input, "keydown", this, "_keydown", false, true));
}

JAK.Console.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	this.dom.container.parentNode.removeChild(this.dom.container);
}

JAK.Console.prototype._setCookie = function(obj) {
	var ser = new JAK.ObjLib();
	document.cookie = this.cookieName+"="+encodeURIComponent(ser.serialize(obj))+"; path=/";
}

JAK.Console.prototype._getCookie = function() {
	var c = document.cookie;
	var obj = null;
	var parts = c.split(";");
	var re = new RegExp(this.cookieName+"=([^;]*)");
	for (var i=0;i<parts.length;i++) {
		var part = parts[i];
		var r = re.exec(part);
		if (r) { 
			try {
				obj = eval("("+decodeURIComponent(r[1])+")"); 
			} catch(e) {}
		}
	}
	return obj;
}

JAK.Console.prototype._save = function() {
	var obj = {
		left:this.left,
		top:this.top,
		width:this.width,
		height:this.height,
		state:this.state
	}
	this._setCookie(obj);
}

JAK.Console.prototype._load = function() {
	var data = this._getCookie();
	if (data) {
		this.left = data.left;
		this.top = data.top;
		this.width = data.width;
		this.height = data.height;
		this._restyle();
		this.switchTo(data.state);
	}
}

JAK.Console.prototype._buildControl = function() {
	this.dom.toggle = JAK.cel("div", "console-toggle");
	
	this.dom.resize = JAK.cel("div", "console-resize");
	this.dom.resize.innerHTML = "¶";
	this.dom.prompt.parentNode.insertBefore(this.dom.resize, this.dom.prompt);
	this.dom.prompt.parentNode.insertBefore(this.dom.toggle, this.dom.prompt);
	this.ec.push(JAK.Events.addListener(this.dom.toggle, "click", this, "toggle", false, true));
	this.ec.push(JAK.Events.addListener(this.dom.toggle, "mousedown", JAK.Events, "stopEvent", false, true));
	this.ec.push(JAK.Events.addListener(this.dom.resize, "mousedown", this, "_downResize", false, true));
	this.ec.push(JAK.Events.addListener(this.dom.prompt, "mousedown", this, "_downMove", false, true));
}

JAK.Console.prototype.switchTo = function(state) {
	this.state = state;
	if (this.state) {
		this.dom.toggle.innerHTML = "&mdash;";
		this.dom.output.style.display = "";
		this.dom.output.scrollTop = this.dom.output.scrollHeight;
		var size = JAK.DOM.getDocSize();
		
		var w = this.dom.container.offsetWidth;
		var h = this.dom.container.offsetHeight;
		if (size.width < this.left + w) {
			this.left = size.width - w;
			this._restyle();
		}
		if (size.height < this.top + h) {
			this.top = size.height - h;
			this._restyle();
		}
	} else {
		this.dom.toggle.innerHTML = "+";
		this.dom.output.style.display = "none";
	}
	this._save();
}

JAK.Console.prototype.toggle = function(e, elm) {
	this.switchTo(!this.state);
}

JAK.Console.prototype._downMove = function(e, elm) {
	this.moving = "move";
	this._x = e.clientX;
	this._y = e.clientY;
	this.eventMove = JAK.Events.addListener(document, "mousemove", this, "_move", false, true);
	this.eventUp = JAK.Events.addListener(document, "mouseup", this, "_up", false, true);
}

JAK.Console.prototype._downResize = function(e, elm) {
	this.moving = "resize";
	this._x = e.clientX;
	this._y = e.clientY;
	this.eventMove = JAK.Events.addListener(document, "mousemove", this, "_move", false, true);
	this.eventUp = JAK.Events.addListener(document, "mouseup", this, "_up", false, true);
}

JAK.Console.prototype._up = function(e, elm) {
	this.moving = "";
	this._save();
	JAK.Events.removeListener(this.eventMove);
	JAK.Events.removeListener(this.eventUp);
}

JAK.Console.prototype._move = function(e, elm) {
	if (!this.moving) { return; }
	var sel = (window.getSelection ? window.getSelection() : document.selection);
	if (sel) { 
		if (sel.empty) { sel.empty(); }
		if (sel.removeAllRanges) { sel.removeAllRanges(); }
	}
	
	var dx = e.clientX - this._x;
	var dy = e.clientY - this._y;
	switch (this.moving) {
		case "move":
			this.left = Math.max(0,this.left + dx);
			this.top = Math.max(0,this.top + dy);
		break;
		case "resize":
			var limit = 10 + this.dom.toggle.offsetWidth + this.dom.prompt.offsetWidth + this.dom.resize.offsetWidth;
			this.width = Math.max(limit, this.width + dx);
			this.height = Math.max(0,this.height + dy);
		break;
	}
	this._x = e.clientX;
	this._y = e.clientY;
	this._restyle();
}

JAK.Console.prototype._restyle = function() {
	var scroll = JAK.DOM.getScrollPos();
	var left = this.left + scroll.x;
	var top = this.top + scroll.y;
	this.dom.container.style.left = left+"px";
	this.dom.container.style.top = top+"px";
	this.dom.container.style.width = this.width+"px";
	this.dom.output.style.height = this.height+"px";
	
	
	var l = this.dom.prompt.offsetWidth + this.dom.toggle.offsetWidth + this.dom.resize.offsetWidth;
	if (JAK.Browser.client == "ie") { l += 6; }
	var w = this.width - l;
	this.dom.input.style.width = w+"px";
}

JAK.Console.prototype._keyup = function(e, elm) {
	if (e.keyCode == 9) { return; }
	this.shell.event(this.dom.input.value, e.keyCode);
}

JAK.Console.prototype._keydown = function(e, elm) {
	if (e.keyCode == 9) {
		JAK.Events.cancelDef(e);
		this.shell.event(this.dom.input.value, e.keyCode);
	}
}

JAK.Console.prototype._scroll = function(e, elm) {
	this._restyle();
}

JAK.Console.prototype.clear = function() {
	JAK.DOM.clear(this.dom.output);
}

JAK.Console.prototype.setPrompt = function(prompt) {
	this.dom.prompt.innerHTML = prompt;
	this._restyle();
}

JAK.Console.prototype.setInput = function(input) {
	this.dom.input.value = input;
	this.dom.input.focus();
}

JAK.Console.prototype.getShell = function() {
	return this.shell;
}

JAK.Console.prototype.print = function(data) {
	var d = JAK.cel("div");
	var str = data;
	if (JAK.Browser.client == "ie") {
		str = str.replace(/\n/g,"<br/>");
	}
	d.innerHTML = str;
	this.dom.output.appendChild(d);
	this.dom.output.scrollTop = this.dom.output.scrollHeight;
}

/* ----------------------------- shell: jadro pudla ---------------- */

/**
 * @class Shell, interpret commandu
 * @group jak-utils
 */ 
JAK.Shell = JAK.ClassMaker.makeClass({
	NAME: "JAK.Shell",
	VERSION: "2.0"
});
JAK.Shell.COMMAND_PREPROCESS = 1;
JAK.Shell.COMMAND_STANDARD = 2;
JAK.Shell.COMMAND_FALLBACK = 3;

/**
 * @param {JAK.Console} [console] volitelna konzole, ktera shell vizualizuje
 */
JAK.Shell.prototype.$constructor = function(console) {
	this.console = console;

	this.context = "";
	this.contextObject = null;
	this.prompt = "";
	
	this.commands = {};
	this.commands[JAK.Shell.COMMAND_PREPROCESS] = [];
	this.commands[JAK.Shell.COMMAND_STANDARD] = [];
	this.commands[JAK.Shell.COMMAND_FALLBACK] = [];

	this.addCommand(new JAK.Shell.Command.Clear());
	this.addCommand(new JAK.Shell.Command.Eval());
	this.addCommand(new JAK.Shell.Command.CD());
	this.addCommand(new JAK.Shell.Command.Pwd());
	this.addCommand(new JAK.Shell.Command.Prompt());
	this.addCommand(new JAK.Shell.Command.Help());
	this.addCommand(new JAK.Shell.Command.History());
	this.addCommand(new JAK.Shell.Command.Exit());
	this.addCommand(new JAK.Shell.Command.ReloadCSS());
	this.addCommand(new JAK.Shell.Command.LS());
	this.addCommand(new JAK.Shell.Command.Suggest());
	this.addCommand(new JAK.Shell.Command.Time());
	this.addCommand(new JAK.Shell.Command.Graph());
	
	this.setContext("");
	this.setPrompt("%{JAK.Browser.client}:%l$");
}

JAK.Shell.prototype.$destructor = function() {
	if (this.console) { this.console.$destructor(); }
}

/* -------------------- verejne metody shellu urcene k vyuziti v commandech ------------------------ */

/**
 * vrati seznam vsech zaregistrovanych dvojic daneho typu 
 */
JAK.Shell.prototype.getCommands = function(type) { 
	return this.commands[type]; 
}

/**
 * zaregistruje command
 */
JAK.Shell.prototype.addCommand = function(command) {
	var hooks = command.getHooks();
	for (var i=0;i<hooks.length;i++) {
		var hook = hooks[i];
		var placement = hook.placement;
		var method = hook.method || "execute";
		this.commands[placement].push([command, method]);
	}
}

/**
 * vycisti konzoli
 */
JAK.Shell.prototype.clear = function() {
	if (this.console) { this.console.clear(); }
}

/**
 * vrati formatovaci retezec pro prompt
 */
JAK.Shell.prototype.getPrompt = function() {
	return this.prompt;
}

/**
 * vrati string aktualniho kontextu
 */
JAK.Shell.prototype.getContext = function() {
	return this.context;
}

/**
 * vrati context jako object 
 */
JAK.Shell.prototype.getContextObject = function() {
	return this.contextObject;
}

/**
 * nastavi formatovaci retezec pro prompt
 */
JAK.Shell.prototype.setPrompt = function(prompt) {
	this.prompt = prompt;
	if (this.console) { 
		var str = this._formatContext();
		this.console.setPrompt(str); 
	}
}

/**
 * nastavi kontext
 */
JAK.Shell.prototype.setContext = function(context) {
	var ptr = window;
	var newContext = [];
	var parts = context.split(".");
	for (var i=0;i<parts.length;i++) {
		var part = parts[i];
		if (!part) { continue; }
		if (!(part in ptr)) { return false; }
		ptr = ptr[part];
		newContext.push(part);
	}
	
	this.context = newContext.join(".");
	this.contextObject = ptr;
	if (this.console) { 
		var str = this._formatContext();
		this.console.setPrompt(str); 
	}
	return true;
}

/**
 * nastala udalost -> shell reaguje 
 */
JAK.Shell.prototype.event = function(input, keyCode) {
	/* preprocess */
	var list = this.commands[JAK.Shell.COMMAND_PREPROCESS];
	for (var i=0;i<list.length;i++) {
		var obj = list[i][0];
		var method = list[i][1];
		this._execute(obj, method, input, keyCode);
	}
	
	var re = input.match(/^ *([^ ]*)/);
	if (keyCode != 13) { return; }
	var cmd = re[1];
	if (this.console) { 
		var c = this.sanitize(this._formatContext());
		this.console.print("<strong>"+c+"</strong>"+this.sanitize(input)+"\n"); 
	}
	
	if (!cmd) { return; }
	
	/* standard */
	var list = this.commands[JAK.Shell.COMMAND_STANDARD];
	var ok = false;
	for (var i=0;i<list.length;i++) { /* vsechny commandy */
		var obj = list[i][0];
		var method = list[i][1];
		var names = obj.getNames();
		if (names.indexOf(cmd) != -1) { /* shoda v nazvu -> vykonat */
			ok = true;
			this._execute(obj, method, input, keyCode);
		}
	}
	
	/* fallback */
	if (!ok) {
		var list = this.commands[JAK.Shell.COMMAND_FALLBACK];
		for (var i=0;i<list.length;i++) {
			var obj = list[i][0];
			var method = list[i][1];
			this._execute(obj, method, input, keyCode);
		}
	}
	
	this.setInput("");
}

/**
 * nastavi hodnotu inputu
 */
JAK.Shell.prototype.setInput = function(input) {
	if (this.console) { this.console.setInput(input); }
}

/**
 * upravi retezec aby se neinterpretoval jako html
 */
JAK.Shell.prototype.sanitize = function(data) {
	var obj = {
		"&":"&amp;",
		"<":"&lt;",
		">":"&gt;"
	};
	var str = "";
	for (var p in obj) { str += p; }
	var re = new RegExp("["+str+"]","g");
	return data.replace(re, function(x) { return obj[x]; });
}

/* -------------------- ostatni byznys: privatni metody, abstraktni command ---------- */

JAK.Shell.prototype._execute = function(command, method, input, keyCode) {
	var result = command[method].apply(command, [input, this, keyCode]);
	if (result && this.console) { this.console.print(result); }
}

/**
 * zformatuje context na prompt
 */
JAK.Shell.prototype._formatContext = function() {
	var p = this.prompt;
	var last = this.context.split(".").pop();
	
	p = p.replace(/%c/g,this.context || "window");
	p = p.replace(/%l/g,last || "window");
	p = p.replace(/%\{.*?\}/g,function(s){
		var s = "("+s.substring(2,s.length-1)+")";
		return eval(s);
	}); 
	return p+" ";
}

/**
 * @class Command - prikaz pro shell
 * @group jak-utils
 */ 
JAK.Shell.Command = JAK.ClassMaker.makeClass({
	NAME:"Command",
	VERSION:"1.0",
	CLASS:"class"
});

JAK.Shell.Command.prototype.$constructor = function() {
	this.names = [];
	this.help = "";
	this.syntax = "";
	this.cookieName = "";
}

JAK.Shell.Command.prototype.getNames = function() { 
	return this.names;
}

JAK.Shell.Command.prototype.getHooks = function() {
	return [{placement:JAK.Shell.COMMAND_STANDARD}];
}

JAK.Shell.Command.prototype.execute = function(input, shell, keyCode) {
	return false;
}

JAK.Shell.Command.prototype.getHelp = function() {
	return this.help;
}

JAK.Shell.Command.prototype.getSyntax = function() {
	return this.syntax;
}

JAK.Shell.Command.prototype._tokenize = function(input) {
	var result = [];
	
	function numSlashes(i) {
		var cnt = 0;
		var ptr = i-1;
		while (ptr >= 0 && input.charAt(ptr) == "\\") {
			cnt++;
			ptr--;
		}
		return cnt;
	}
	
	var current = "";
	var inSpecial = "";
	for (var i=0;i<input.length;i++) {
		var ch = input.charAt(i);
		switch (ch) {
			case '"':
			case "'":
				var num = numSlashes(i);
				if (!(num & 1)) {
					inSpecial = (inSpecial ? "" : ch);
					if (!inSpecial && current) {
						result.push(current);
						current = "";
					}
				}
			break;
			
			case " ":
				if (current && !inSpecial) {
					result.push(current);
					current = "";
				}
			break;
			
			default:
				current += ch;
			break;
		}
	}
	if (current) { result.push(current); }
	
	return result;
}

JAK.Shell.Command.prototype._setCookie = function(obj) {
	var ser = new JAK.ObjLib();
	document.cookie = this.cookieName+"="+encodeURIComponent(ser.serialize(obj))+"; path=/";
}

JAK.Shell.Command.prototype._getCookie = function() {
	var c = document.cookie;
	var obj = null;
	var parts = c.split(";");
	var re = new RegExp(this.cookieName+"=([^;]*)");
	for (var i=0;i<parts.length;i++) {
		var part = parts[i];
		var r = re.exec(part);
		if (r) { 
			try {
				obj = eval("("+decodeURIComponent(r[1])+")"); 
			} catch(e) {}
		}
	}
	return obj;
}

JAK.Shell.Command.prototype._stripFormat = function(str) {
	return str.replace(/<[^>]+>/g,"");
}

/* ------------------------- zde nasleduji jednotlive commandy ------------------ */

/**
 * @class Clear - vycisteni console
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.Clear = JAK.ClassMaker.makeClass({
	NAME:"Clear",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.Clear.prototype.$constructor = function() {
	this.names = ["clear","cls"];
	this.help = "clear the console";
}

JAK.Shell.Command.Clear.prototype.execute = function(input, shell, keyCode) {
	shell.clear();
	return false;
}

/* */

/**
 * @class Eval - vykonani JS kodu
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.Eval = JAK.ClassMaker.makeClass({
	NAME:"Eval",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.Eval.prototype.getHooks = function() {
	return [{placement:JAK.Shell.COMMAND_FALLBACK}];
}

JAK.Shell.Command.Eval.prototype.execute = function(input, shell, keyCode) {
	var context = shell.getContextObject();
	this.shell = shell;
	var result = this.evaluator.call(context, context, input);
	var str = this._format(result);
	return str;
}

JAK.Shell.Command.Eval.prototype._addClass = function(str, c) {
	return '<span class="'+c+'">'+str+'</span>';
}

JAK.Shell.Command.Eval.prototype._formatError = function(e) {
	var type = e.name || "Error";
	var arr = [];
	var str = this._addClass(type+": "+this._format(e.message), "object");
	arr.push(str);
	
	var props = ["lineNumber", "opera#sourceloc", "line"];
	for (var i=0;i<props.length;i++) {
		if (props[i] in e) {
			var str = this._addClass("Line: "+this._format(e[props[i]]), "object");
			arr.push(str);
		}
	}
	
	if (e.stack) {
		var str = this._addClass("Stack: "+this._format(e.stack), "object");
		arr.push(str);
	}
	
	return arr.join("\n");
}

JAK.Shell.Command.Eval.prototype._format = function(data, simple) {
	if (data === null) { 
		return this._addClass("null","null"); 
	} else if (typeof(data) == "undefined") {
		return this._addClass("undefined","null"); 
	} else if (data instanceof String || typeof(data) == "string") {
		var d = this.shell.sanitize(data);
		return this._addClass('"'+d+'"',"string");
	} else if (data instanceof Number || typeof(data) == "number") {
		return this._addClass(data,"number");
	} else if (data instanceof Boolean || typeof(data) == "boolean") {
		return this._addClass(data,"bool");
	} else if (data instanceof Error) {
		return this._formatError(data);
	} else if (data instanceof RegExp || data instanceof Date || data instanceof Function) {
		if (simple && data instanceof Function) { return this._addClass("function", "object"); }
		return this._addClass(data.toString(), "object");
	} else if (data instanceof Array) {
		if (simple) { return this._addClass("["+data.length+"]", "array"); }
		var a = [];
		for (var i=0;i<data.length;i++) {
			a.push(arguments.callee.call(this, data[i], true));
		}
		return this._addClass("["+a.join(", ")+"]", "array");
	} else {
		if (simple) { return this._addClass("[Object]", "object"); }
		var limit = 5;
		var arr = ["Object"];
		for (var p in data) {
			arr.push(p+"="+arguments.callee.call(this, data[p], true));
			limit--;
			if (!limit) { break; }
		}
		return this._addClass("["+arr.join(" ")+"]", "object");
	}
}

JAK.Shell.Command.Eval.prototype.evaluator = function(context, str) {
	try {
		if (JAK.Browser.client != "opera") {
			with (context) {
				var result = eval(str);
			}
		} else {
			var result = eval(str);
		}
		return result;
	} catch(e) {
		return e;
	}
	return "";
}

/* */

/**
 * @class CD - zmena kontextu
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.CD = JAK.ClassMaker.makeClass({
	NAME:"CD",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.CD.prototype.$constructor = function() {
	this.names = ["cd"];
	this.help = "switch context to new value";
	this.syntax = "cd [new_context] (no context = window)";
}

JAK.Shell.Command.CD.prototype.execute = function(input, shell, keyCode) {
	var argv = this._tokenize(input);
	var newContext = "";
	if (argv.length > 1) { 
		if (argv[1] == "..") {
			var c = shell.getContext().split(".");
			c.splice(c.length-1,1);
			newContext = c.join(".");
		} else {
			newContext = shell.getContext()+"."+argv[1]; 
		}
	}
	var result = shell.setContext(newContext);
	if (!result) { return "Cannot change context to '"+newContext+"'"; }
	return false;
}

/* */

/**
 * @class Prompt - zmena promptu
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.Prompt = JAK.ClassMaker.makeClass({
	NAME:"Prompt",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.Prompt.prototype.$constructor = function() {
	this.names = ["prompt"];
	this.help = "view or set the prompt formatting mask";
	this.syntax = "prompt [mask] (%c = context, %l = last context part, %{} = eval()'ed code)";
}

JAK.Shell.Command.Prompt.prototype.execute = function(input, shell, keyCode) {
	var argv = this._tokenize(input);
	if (argv.length > 1) {
		var p = argv[1];
		shell.setPrompt(p);
	} else {
		return shell.getPrompt();
	}
	return false;
}

/* */

/**
 * @class Help - vypis prikazu a jejich pouziti
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.Help = JAK.ClassMaker.makeClass({
	NAME:"Help",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.Help.prototype.$constructor = function() {
	this.names = ["help", "man"];
	this.help = "describe command or list commands";
	this.syntax = "help [command]";
}

JAK.Shell.Command.Help.prototype.execute = function(input, shell, keyCode) {
	var argv = this._tokenize(input);
	var commands = shell.getCommands(JAK.Shell.COMMAND_STANDARD);
	if (argv.length > 1) {
		var command = false;
		var c = argv[1];
		for (var i=0;i<commands.length;i++) {
			var names = commands[i][0].getNames();
			if (names.indexOf(c) != -1) { command = commands[i][0]; }
		}

		if (command) {
			var h = command.getHelp();
			if (h) {
				var str = "<strong>"+command.getNames().join(", ")+"</strong>: " + h;
				var s = command.getSyntax();
				if (s) { str += "\n<strong>Syntax: </strong>" + s; }
				return str;
			} else {
				return "Command <strong>"+c+"</strong> has no help";
			}
		} else {
			return "There is no command <strong>"+c+"</strong>";
		}
	} else {
		var result = "Available commands:\n";
		var arr = [];
		
		var pairs = [];
		var max = 0;
		for (var i=0;i<commands.length;i++) {
			var obj = commands[i][0];
			var names = obj.getNames().join(", ");
			var help = obj.getHelp();
			pairs.push([names, help]);
			max = Math.max(max, names.length);
		}
		for (var i=0;i<pairs.length;i++) {
			var item = pairs[i];
			var str = "<strong>"+item[0]+"</strong>";
			for (var j=item[0].length; j < max+1; j++) { str += " "; }
			str += item[1];
			arr.push(str);
		}
		
		arr.sort();
		result += arr.join("\n");
		return result;
	}
}

/* */

/**
 * @class Historie prikazu
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.History = JAK.ClassMaker.makeClass({
	NAME:"History",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.History.prototype.$constructor = function() {
	this.ptr = -1;
	this.stack = [];
	this.lastTyped = "";
	this.names = ["history"];
	this.help = "show or clear history";
	this.syntax = "history [clear]";
	this.cookieName = "history";

	/* load from cookie */
	this._load();
}

JAK.Shell.Command.History.prototype._save = function() {
	this._setCookie(this.stack);
}

JAK.Shell.Command.History.prototype._load = function() {
	var data = this._getCookie();
	if (data) {
		this.stack = data;
		this.ptr = this.stack.length;
	}
}

JAK.Shell.Command.History.prototype.getHooks = function() {
	return [
		{placement:JAK.Shell.COMMAND_PREPROCESS, method:"_key"},
		{placement:JAK.Shell.COMMAND_PREPROCESS, method:"_record"},
		{placement:JAK.Shell.COMMAND_STANDARD}
	];
}

JAK.Shell.Command.History.prototype._key = function(input, shell, keyCode) {
	switch (keyCode) {
		case 38:
			if (this.ptr > 0) {
				this.ptr--;
				if (!this.lastTyped) {
					this.lastTyped = input;
				}
				shell.setInput(this.stack[this.ptr]);
			}
		break;
		
		case 40:
			if (this.ptr == this.stack.length) { break; }
			this.ptr++;
			if (this.ptr == this.stack.length) {
				shell.setInput(this.lastTyped);
			} else {
				shell.setInput(this.stack[this.ptr]);
			}
		break;
	}
}

JAK.Shell.Command.History.prototype._record = function(input, shell, keyCode) {
	if (keyCode != 13) { return; }
	this.lastTyped = "";
	if (input.length) {
		this.stack.push(input);
		this.ptr = this.stack.length;
	}
	this._save();
}

JAK.Shell.Command.History.prototype.execute = function(input, shell, keyCode) {
	var argv = this._tokenize(input);
	if (argv.length > 1 && argv[1] == "clear") {
		this.stack = [];
		this.ptr = -1;
		this.lastTyped = "";
		this._save();
		return "History cleared";
	} else {
		var str = "";
		str += this.stack.join("\n");
		str += "\nTotal: "+this.stack.length+" items";
		return str;
	}
}

/* */

/**
 * @class Vypnuti shellu
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.Exit = JAK.ClassMaker.makeClass({
	NAME:"Exit",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.Exit.prototype.$constructor = function() {
	this.names = ["quit", "exit", "bye"];
	this.help = "destroy shell & console";
}

JAK.Shell.Command.Exit.prototype.execute = function(input, shell, keyCode) {
	shell.$destructor();
	return false;
}

/* */

/**
 * @class Reload CSSek
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.ReloadCSS = JAK.ClassMaker.makeClass({
	NAME:"ReloadCSS",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.ReloadCSS.prototype.$constructor = function() {
	this.names = ["rcss"];
	this.help = "reload appended stylesheets";
}

JAK.Shell.Command.ReloadCSS.prototype.execute = function(input, shell, keyCode) {
	var styles = [];
	var urls = [];
	var all = document.getElementsByTagName("link");
	var h = document.getElementsByTagName("head");

	if (h.length) {
		h = h[0];
	} else {
		return "No &lt;head&gt; element found";
	}

	for (var i=0;i<all.length;i++) { /* projit a zapamatovat */
		if (all[i].rel == "stylesheet") { 
			styles.push(all[i]); 
			var url = all[i].href.match(/^[^?]+/);
			urls.push(url[0]);
		}
	}
	for (var i=0;i<styles.length;i++) { /* vyfakovat */
		styles[i].parentNode.removeChild(styles[i]);
	}
	for (var i=0;i<urls.length;i++) { /* vyrobit */
		var l = JAK.mel("link", {rel:"stylesheet", type:"text/css"});
		l.href = urls[i]+"?"+Math.random();
		h.appendChild(l);
	}
	
	if (urls.length) { 
		return urls.length + " stylesheet(s) reloaded";
	} else {
		return "No stylesheets found";
	}
}

/* */

/**
 * @class Vypis vlastnosti v danem kontextu
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.LS = JAK.ClassMaker.makeClass({
	NAME:"LS",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.LS.prototype.$constructor = function() {
	this.names = ["ls"];
	this.help = "list available properties in current context";
}

JAK.Shell.Command.LS.prototype.execute = function(input, shell, keyCode) {
	var obj = shell.getContextObject();
	var list = [];
	for (var p in obj) { list.push(p); }
	list.sort(function(a,b) {
		return (a.toLowerCase() < b.toLowerCase() ? -1 : 1);
	});
	for (var i=0;i<list.length;i++) {
		var p = list[i];
		var val = obj[p];
		var cn = "";
		
		if (typeof(val) == "undefined" || val === null) {
			cn = "null";
		} else if (typeof(val) == "number" || val instanceof Number) {
			cn = "number";
		} else if (typeof(val) == "boolean" || val instanceof Boolean) {
			cn = "bool";
		} else if (typeof(val) == "string" || val instanceof String) {
			cn = "string";
		} else if (val instanceof Array) {
			cn = "array";
		} else {
			cn = "object";
		}
		
		if (cn) { list[i] = '<span class="'+cn+'">'+p+'</span>'; }
	}
	return list.join("\n");
}

/* */

/**
 * @class Napoveda vlastnosti / commandu
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.Suggest = JAK.ClassMaker.makeClass({
	NAME:"Suggest",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.Suggest.prototype.$constructor = function() {
}

JAK.Shell.Command.Suggest.prototype.getHooks = function() {
	return [{placement:JAK.Shell.COMMAND_PREPROCESS, method:"suggest"}];
}

JAK.Shell.Command.Suggest.prototype._insensitiveSort = function(a,b) {
	return (a.toLowerCase() < b.toLowerCase() ? -1 : 1);
}

JAK.Shell.Command.Suggest.prototype.suggest = function(input, shell, keyCode) {
	if (keyCode != 9) { return false; }
	var part = input.match(/[^ ]*$/);
	part = part[0];
	
	/* list properties when part contains dot or when this is not first word */
	var first = input.match(/^ *([^ ]*)/);
	first = first[1];
	
	if (part.indexOf(".") != -1 || first != part) {
		var data = this._listProperties(part, shell);
	} else {
		var data = this._listCommands(part, shell);
	}

	var remainder = data[0];
	var options = data[1];

	if (remainder) { shell.setInput(input + remainder); }
	if (options.length) {
		return options.sort(this._insensitiveSort).join("\n");
	} else { return false; }
	
}

JAK.Shell.Command.Suggest.prototype._listCommands = function(str, shell) {
	var commands = shell.getCommands(JAK.Shell.COMMAND_STANDARD);
	var result = [];
	
	var all = [];
	for (var i=0;i<commands.length;i++) {
		var obj = commands[i][0];
		var names = obj.getNames();
		for (var j=0;j<names.length;j++) { all.push(names[j]); }
	}
	var re = new RegExp("^"+str);
	for (var i=0;i<all.length;i++) {
		if (re.test(all[i])) { result.push(all[i]); }
	}
	
	if (!result.length) { return ["",[]]; } /* zadny vysledek */
	if (result.length == 1) { /* prave jeden vysledek */
		return [result[0].substring(str.length),[]];
	} else { /* vice vysledku - najit spolecny zacatek */
		var cmd = "";
		var ch = "";
		var ok = true;
		var index = 0;
		while (ok) {
			for (var i=0;i<result.length;i++) {
				if (!i) { 
					ch = result[i].charAt(index); 
				} else {
					ok = ok && (result[i].charAt(index) == ch);
				}
			}
			if (!ch) { ok = false; }
			if (ok) { cmd += ch; }
			index++;
		}
		cmd = cmd.substring(str.length);
		return [cmd,result];
	}
}

JAK.Shell.Command.Suggest.prototype._listProperties = function(str, shell) {
	var start = window;
	var context = shell.getContextObject();
	if (str.match(/^this/)) { start = shell.getContextObject(); }
	var ptr = context;
	
	var parts = str.split("."); /* docestovat dle zatim zadane cesty */
	for (var i=0;i<parts.length;i++) {
		var part = parts[i];
		if (!i && part == "this") { continue; }
		if (part == "") { continue; }
		if (i+1 != parts.length) { 
			if (part in ptr) {
				ptr = ptr[part]; 
			} else {
				return ["",[]];
			}
		}
	}
	
	var last = parts.pop();
	var props = this._listStartProperties(ptr, last);
	
	if (last in ptr && props.length == 1) {
		ptr = ptr[last];
		props = this._listStartProperties(ptr, "");
		return [".",props];
	}
	
	if (last == "") {
		return ["",props];
	}
	
	switch (props.length) { /* rozhodnout podle poctu moznosti, ktere odpovidaji */
		case 0: return ["",[]]; break;
		case 1: return [props[0].substring(last.length),[]]; break;
		default:
			var cmd = "";
			var ch = "";
			var ok = true;
			var index = 0;
			while (ok) {
				for (var i=0;i<props.length;i++) {
					if (!i) { 
						ch = props[i].charAt(index); 
					} else {
						ok = ok && (props[i].charAt(index) == ch);
					}
				}
				if (!ch) { ok = false; }
				if (ok) { cmd += ch; }
				index++;
			}
			cmd = cmd.substring(str.length);
			return [cmd,props];
		break;
	}
}

JAK.Shell.Command.Suggest.prototype._listStartProperties = function(obj, prefix) {
	var re = new RegExp("^"+prefix);
	var result = [];
	for (var p in obj) {
		if (re.test(p)) { result.push(p); }
	}
	return result;
}

/* */

/**
 * @class Vypis kontextu
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.Pwd = JAK.ClassMaker.makeClass({
	NAME:"Pwd",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.Pwd.prototype.$constructor = function() {
	this.names = ["pwd"];
	this.help = "display current context";
}

JAK.Shell.Command.Pwd.prototype.execute = function(input, shell, keyCode) {
	return shell.getContext() || "window";
}

/* */

/**
 * @class Mereni doby vykonani
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.Time = JAK.ClassMaker.makeClass({
	NAME:"Time",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.Time.prototype.$constructor = function() {
	this.names = ["time"];
	this.help = "measure execution time";
	this.syntax = "time [any code here]";
}

JAK.Shell.Command.Time.prototype.execute = function(input, shell, keyCode) {
	var regs = input.match(/^ *time *(.*)$/);
	var cmd = regs[1];
	
	if (!cmd) { return "No code given"; }
	
	var t1 = new Date();
	try { eval(cmd); } 
	finally {
		var t2 = new Date();
		return this._format(t2.getTime() - t1.getTime());
	}
}

JAK.Shell.Command.Time.prototype._format = function(msec) {
	return msec + " msec";
}

/* */

/**
 * @class Generovani grafu zavislosti, namespace, dedicnosti
 * @augments JAK.Shell.Command
 */ 
JAK.Shell.Command.Graph = JAK.ClassMaker.makeClass({
	NAME:"Graph",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:JAK.Shell.Command
});

JAK.Shell.Command.Graph.prototype.$constructor = function() {
	this.cache = [];
	this.names = ["graph"];
	this.help = "generates inheritance/components/namespace/instances/json graphs(s)";
	this.syntax = "graph [i][c][n][s][j] [depth] (default depth = 1)";
	this.ignore = ["eOwner","eSender","prototype"];
}

JAK.Shell.Command.Graph.prototype.execute = function(input, shell, keyCode) {
	this.cache = [];
	var argv = this._tokenize(input);
	if (argv.length == 1) { return "No arguments given"; }

	this.depth = (argv.length > 2 ? parseInt(argv[2],10) : 1);
	var what = argv[1];
	
	var root = shell.getContextObject();
	var result = "digraph G {\n";
	result += '\t label="Red = inheritance\\nBlue = components\\nGreen = namespace\\nCyan = instances\\nMagenta = JSON"\n';
	result += '\t labelloc="top"\n';
	result += '\t labeljust="l"\n';
	
	if (what.indexOf("i") != -1) { result += this._get(root, 1, "color=red"); }
	if (what.indexOf("c") != -1) { result += this._get(root, 2, "color=blue"); }
	if (what.indexOf("n") != -1) { result += this._get(root, 3, "color=green"); }
	if (what.indexOf("s") != -1) { result += this._get(root, 4, "color=cyan"); }
	if (what.indexOf("j") != -1) { result += this._get(root, 5, "color=magenta"); }
	
	for (var i=0;i<this.cache.length;i++) {
		var item = this.cache[i];
		result += '\t '+i+' [label="'+item[1]+'"]\n';
	}

	result += "}\n";
	return result;
}

JAK.Shell.Command.Graph.prototype._getId = function(item) {
	for (var i=0;i<this.cache.length;i++) {
		if (this.cache[i][0] == item) { return i; }
	}

	var n = null; /* find name */
	try {
		if (item === null) {
			n = "null";
		} else if (item.NAME) {
			n = item.NAME;
			if (item.VERSION) { n += " "+item.VERSION; }
		} else if (item.constructor && item.constructor.NAME) {
			n = item.constructor.NAME;
			if (item.constructor.VERSION) { n += " "+item.constructor.VERSION; }
			n += " (i)";
		} else { n = typeof(item); };
	} catch (e) {
	} finally {
		this.cache.push([item,n]);
		return this.cache.length-1;
	}
}

JAK.Shell.Command.Graph.prototype._getInheritance = function(data, implement) {
	var triples = [];
	for (var i=0;i<data.length;i++) {
		var c = data[i];
		if (c.EXTEND && !implement) {
			triples.push([c.EXTEND,c]);
		}
		if (c.IMPLEMENT && implement) {
			for (var j=0;j<c.IMPLEMENT.length;j++) {
				triples.push([c.IMPLEMENT[j],c]);
			}
		}
	}
	return triples;
}

JAK.Shell.Command.Graph.prototype._getComponents = function(data) {
	var triples = [];
	for (var i=0;i<data.length;i++) {
		var cl = data[i];
		if (!cl.prototype) { continue; }
		var c = false;
		if ("$constructor" in cl.prototype) { 
			c = cl.prototype.$constructor; 
		} else if (cl.NAME in cl.prototype) { 
			c = cl.prototype[cl.NAME]; 
		}
		if (!c) { continue; } /* cannot find constructor */
		
		var r = c.toString().match(/components *=(.*?);/);
		if (!r) { continue; }
		var arr = eval(r[1]);
		for (var j=0;j<arr.length;j++) {
			var comp = arr[j].part;
			var label = arr[j].name;
			triples.push([cl,comp,label]);
		}
	}
	return triples;
}

JAK.Shell.Command.Graph.prototype._serializeTriples = function(triples) {
	var data = "";
	for (var i=0;i<triples.length;i++) {
		var t = triples[i];
		var n1 = this._getId(t[0]);
		var n2 = this._getId(t[1]);
		n3 = (t.length > 2 ? t[2] : "");
		data += '\t '+n1+' -> '+n2;
		var label = n3 || " ";
		data += '	[label="'+label+'"]';
		data += "\n";
	}
	return data;
}

JAK.Shell.Command.Graph.prototype._scanClasses = function(node, results, cache) {
	var c = cache || [];
	c.push(node);
	if (node.NAME && typeof(node) == "function") { results.push(node); }
	for (var p in node) {
		var val = node[p];
		if (!val) { continue; }
		if (!val.NAME) { continue; }
		if (c.indexOf(val) == -1) { arguments.callee.call(this, val, results, c); }
	}
}

JAK.Shell.Command.Graph.prototype._scanNameSpace = function(node, results, cache) {
	var c = cache || [];
	c.push(node);
	for (var p in node) {
		if (p == "EXTEND" || this.ignore.indexOf(p) != -1 || p == "owner") { continue; }
		var val = node[p];
		if (!val) { continue; }
		if (!val.NAME) { continue; }
		results.push([node,val]);
		if (c.indexOf(val) == -1) { arguments.callee.call(this, val, results, c); }
	}
}

JAK.Shell.Command.Graph.prototype._scanJSON = function(nodeList, results, cache, depth) {
	var d = depth || 0;
	var todo = [];
	var c = cache || [];
	
	for (var i=0;i<nodeList.length;i++) {
		var parent = nodeList[i];
		c.push(parent);
		for (var p in parent) {
			var val = null;
			try {
				val = parent[p];
			} catch (e) {} 
			results.push([parent,val,p]);
			if (val && typeof(val) == "object" && c.indexOf(val) == -1) {
				todo.push(val); 
			}
		}
	}
	
	if (d+1 < this.depth) { arguments.callee.call(this, todo, results, c, d+1); }
}

JAK.Shell.Command.Graph.prototype._scanInstances = function(node, results, parent, cache, prefix) {
	var pref = prefix || "";
	var c = cache || [];
	c.push(node);
	for (var p in node) {
		var val = node[p];
		if (!val) { continue; }
		if (this.ignore.indexOf(p) != -1) { continue; }
		if (val.constructor != Function && val.constructor != Object && val.constructor != Array) { continue; }
		
		var par = parent;
		if (val.constructor) {
			if (parent.constructor /* && c.indexOf(val) == -1 */) {
				var label = "";
				if (pref) {
					var arr = pref.split(",");
					for (var i=0;i<arr.length;i++) {
						if (i) { label += "["; }
						label += arr[i];
						if (i) { label += "]"; }
					}
					label += "[" + p + "]";
				} else {
					label = p;
				}
				results.push([parent,val,label]);
			}
			par = val;
		}
		if (val instanceof Array) { 
			var arr = pref.split(",");
			if (!pref) { arr = []; }
			arr.push(p);
			pref = arr.join(",");
		}
		if (c.indexOf(val) == -1) { arguments.callee.call(this, val, results, par, c, par == val ? "" : pref); }
		if (val instanceof Array) { 
			var arr = pref.split(",");
			arr.pop();
			pref = arr.join(",");
		}
	}
}

JAK.Shell.Command.Graph.prototype._get = function(root, mode, style, ignore) {
	var result = "\t edge ["+style+",style=solid,constraint=true]\n";
	var data = [];

	if (mode == 1 || mode == 2) {
		this._scanClasses(root, data);
		if (mode == 1) {
			var d2 = this._getInheritance(data, false);
			result += this._serializeTriples(d2);
			result += "\t edge ["+style+",style=dotted,constraint=false]\n";
			d2 = this._getInheritance(data, true);
			result += this._serializeTriples(d2);
		} else {
			var d2 = this._getComponents(data);
			result += this._serializeTriples(d2);
		}
	}
	
	if (mode == 3) {
		this._scanNameSpace(root, data);
		result += this._serializeTriples(data);
	}
	
	if (mode == 4) {
		this._scanInstances(root, data, root);
		result += this._serializeTriples(data);
	}
	
	if (mode == 5) {
		this._scanJSON([root], data);
		result += this._serializeTriples(data);
	}

	return result;
}

/* */

if (!window.console) {
	var log = function(str) {
		if (JAK.console){ 
			var s = str;
			if (typeof(s) == "string" || s instanceof String) {
				s = JAK.console.getShell().sanitize(s);
			}
			JAK.console.print("<strong>Debug: </strong>"+s);
		} else {
			alert(str);
		}
	}
	
	var names = ["log", "info", "warn", "error"];
	var obj = {};
	for (var i=0;i<names.length;i++) {
		obj[names[i]] = log;
	}
	window.console = obj;
}
