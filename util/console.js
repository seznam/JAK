SZN.Shell = SZN.ClassMaker.makeClass({
	NAME:"Shell",
	VERSION:"1.0",
	CLASS:"class"
});
SZN.Shell.COMMAND_PREPROCESS = 1;
SZN.Shell.COMMAND_STANDARD = 2;
SZN.Shell.COMMAND_FALLBACK = 3;

SZN.Shell.prototype.$constructor = function(console) {
	this.console = console;

	this.context = "";
	this.contextObject = null;
	this.prompt = "";
	
	this.commands = {};
	this.commands[SZN.Shell.COMMAND_PREPROCESS] = [];
	this.commands[SZN.Shell.COMMAND_STANDARD] = [];
	this.commands[SZN.Shell.COMMAND_FALLBACK] = [];

	this.addCommand(new SZN.Shell.Command.Clear());
	this.addCommand(new SZN.Shell.Command.Eval());
	this.addCommand(new SZN.Shell.Command.CD());
	this.addCommand(new SZN.Shell.Command.Prompt());
	this.addCommand(new SZN.Shell.Command.Help());
	this.addCommand(new SZN.Shell.Command.History());
	this.addCommand(new SZN.Shell.Command.Exit());
	this.addCommand(new SZN.Shell.Command.ReloadCSS());
	
	this.setContext("");
	this.setPrompt("%c@%{SZN.Browser.client}>");
}

SZN.Shell.prototype.$destructor = function() {
	if (this.console) { this.console.$destructor(); }
}

/* -------------------- verejne metody shellu urcene k vyuziti v commandech ------------------------ */

/**
 * vrati seznam vsech zaregistrovanych dvojic daneho typu 
 */
SZN.Shell.prototype.getCommands = function(type) { 
	return this.commands[type]; 
}

/**
 * zaregistruje command
 */
SZN.Shell.prototype.addCommand = function(command) {
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
SZN.Shell.prototype.clear = function() {
	if (this.console) { this.console.clear(); }
}

/**
 * vrati formatovaci retezec pro prompt
 */
SZN.Shell.prototype.getPrompt = function() {
	return this.prompt;
}

/**
 * vrati string aktualniho kontextu
 */
SZN.Shell.prototype.getContext = function() {
	return this.context;
}

/**
 * vrati context jako object 
 */
SZN.Shell.prototype.getContextObject = function() {
	return this.contextObject;
}

/**
 * nastavi formatovaci retezec pro prompt
 */
SZN.Shell.prototype.setPrompt = function(prompt) {
	this.prompt = prompt;
	if (this.console) { 
		var str = this._formatContext();
		this.console.setPrompt(str); 
	}
}

/**
 * nastavi kontext
 */
SZN.Shell.prototype.setContext = function(context) {
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
SZN.Shell.prototype.event = function(input, keyCode) { /* xxx todo: rozlisit command a event */
	var argv = this._parseInput(input);

	/* preprocess */
	var list = this.commands[SZN.Shell.COMMAND_PREPROCESS];
	for (var i=0;i<list.length;i++) {
		var obj = list[i][0];
		var method = list[i][1];
		obj[method].apply(obj, [argv, this, keyCode]);
	}
	
	if (!argv.length || keyCode != 13) { return; }
	
	/* standard */
	var list = this.commands[SZN.Shell.COMMAND_STANDARD];
	var ok = false;
	for (var i=0;i<list.length;i++) { /* vsechny commandy */
		var obj = list[i][0];
		var method = list[i][1];
		var names = obj.getNames();
		if (names.indexOf(argv[0]) != -1) { /* shoda v nazvu -> vykonat */
			ok = true;
			obj[method].apply(obj, [argv, this, keyCode]);
		}
	}
	
	/* fallback */
	if (!ok) {
		var list = this.commands[SZN.Shell.COMMAND_FALLBACK];
		for (var i=0;i<list.length;i++) {
			var obj = list[i][0];
			var method = list[i][1];
			obj[method].apply(obj, [argv, this, keyCode]);
		}
	}
	
	this.setInput("");
}

/**
 * nastavi hodnotu inputu
 */
SZN.Shell.prototype.setInput = function(input) {
	if (this.console) { this.console.setInput(input); }
}

/**
 * vystup neceho do konzole
 */
SZN.Shell.prototype.print = function(data, options) {
	if (this.console) { this.console.print(data, options); }
}

/* -------------------- ostatni byznys: privatni metody, console, abstraktni command ---------- */

/**
 * zformatuje context na prompt
 */
SZN.Shell.prototype._formatContext = function() {
	var p = this.prompt;
	var last = this.context.split(".").pop();
	
	p = p.replace(/%c/g,this.context || "window");
	p = p.replace(/%l/g,last || "window");
	p = p.replace(/%{.*?}/g,function(s){
		var s = "("+s.substring(2,s.length-1)+")";
		return eval(s);
	});
	/* replace */
	return p;
}

/**
 * rozseka vstup na parametry
 */
SZN.Shell.prototype._parseInput = function(input) {
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

SZN.Console = SZN.ClassMaker.makeClass({
	NAME:"Console",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Console.prototype.$constructor = function() {
	this.ec = []
	this.dom = {
		container:SZN.cEl("div",false,"console-container"),
		input:SZN.cEl("input",false,"console-input"),
		output:SZN.cEl("div",false,"console-output"),
		prompt:SZN.cEl("span",false,"console-prompt")
	}
	
	SZN.Dom.append([this.dom.container, this.dom.output, this.dom.prompt, this.dom.input]);
	document.body.insertBefore(this.dom.container, document.body.firstChild);
	this.shell = new SZN.Shell(this);
	
	this.dom.input.focus();
	this.ec.push(SZN.Events.addListener(this.dom.input, "keyup", this, "_keyup", false, true));
	this.ec.push(SZN.Events.addListener(this.dom.input, "keydown", this, "_keydown", false, true));
}

SZN.Console.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	this.dom.container.parentNode.removeChild(this.dom.container);
}

SZN.Console.prototype._keyup = function(e, elm) {
	this.shell.event(this.dom.input.value, e.keyCode);
}

SZN.Console.prototype._keydown = function(e, elm) {
	if (e.keyCode == 9) {
		SZN.Events.cancelDef(e);
		this.shell.event(this.dom.input.value, e.keyCode);
	}
}

SZN.Console.prototype.clear = function() {
	SZN.Dom.clear(this.dom.output);
}

SZN.Console.prototype.setPrompt = function(prompt) {
	this.dom.prompt.innerHTML = prompt;
}

SZN.Console.prototype.setInput = function(input) {
	this.dom.input.value = input
}

SZN.Console.prototype.getShell = function() {
	return this.shell;
}

SZN.Console.prototype.print = function(data, options) {
	var opts = {
		whiteSpace:"pre"
	}
	for (var p in options) { opts[p] = options[p]; }
	var d = SZN.cEl("div",false,false,{whiteSpace:opts.whiteSpace});
	d.innerHTML = data;
	this.dom.output.appendChild(d);
}

SZN.Shell.Command = SZN.ClassMaker.makeClass({
	NAME:"Command",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Shell.Command.prototype.$constructor = function() {
	this.names = [];
	this.help = "";
}

SZN.Shell.Command.prototype.getNames = function() { 
	return this.names;
}

SZN.Shell.Command.prototype.getHooks = function() {
	return [{placement:SZN.Shell.COMMAND_STANDARD}];
}

SZN.Shell.Command.prototype.execute = function(argv, shell, keyCode) {
}

SZN.Shell.Command.prototype.getHelp = function() {
	return this.help;
}

/* ------------------------- zde nasleduji jednotlive commandy ------------------ */

SZN.Shell.Command.Clear = SZN.ClassMaker.makeClass({
	NAME:"Clear",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:SZN.Shell.Command
});

SZN.Shell.Command.Clear.prototype.$constructor = function() {
	this.names = ["clear","cls"];
	this.help = "clear the console";
}

SZN.Shell.Command.Clear.prototype.execute = function(argv, shell, keyCode) {
	shell.clear();
}

/**/

SZN.Shell.Command.Eval = SZN.ClassMaker.makeClass({
	NAME:"Eval",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:SZN.Shell.Command
});

SZN.Shell.Command.Eval.prototype.getHooks = function() {
	return [{placement:SZN.Shell.COMMAND_FALLBACK}];
}

SZN.Shell.Command.Eval.prototype.execute = function(argv, shell, keyCode) {
	var str = "("+argv.join(" ")+")";
	var context = shell.getContextObject();
	var result = this.evaluator.call(context, str);
	shell.print(result);
}

SZN.Shell.Command.Eval.prototype.evaluator = function(str) {
	try {
		var result = eval(str);
		return result;
	} catch(e) {
		return e;
	}
	return "";
}

/**/

SZN.Shell.Command.CD = SZN.ClassMaker.makeClass({
	NAME:"CD",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:SZN.Shell.Command
});

SZN.Shell.Command.CD.prototype.$constructor = function() {
	this.names = ["cd"];
	this.help = "change context, no value == window";
}

SZN.Shell.Command.CD.prototype.execute = function(argv, shell, keyCode) {
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
	if (!result) {
		shell.print("Cannot change context to '"+newContext+"'");
	}
}

/**/

SZN.Shell.Command.Prompt = SZN.ClassMaker.makeClass({
	NAME:"Prompt",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:SZN.Shell.Command
});

SZN.Shell.Command.Prompt.prototype.$constructor = function() {
	this.names = ["prompt"];
	this.help = "view or set the prompt formatting mask: %c = context, %l = last context part, %{} = eval()'ed code";
}

SZN.Shell.Command.Prompt.prototype.execute = function(argv, shell, keyCode) {
	if (argv.length > 1) {
		var p = argv[1];
		shell.setPrompt(p);
	} else {
		shell.print(shell.getPrompt());
	}
}

/**/

SZN.Shell.Command.Help = SZN.ClassMaker.makeClass({
	NAME:"Help",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:SZN.Shell.Command
});

SZN.Shell.Command.Help.prototype.$constructor = function() {
	this.names = ["help", "man"];
	this.help = "describe command or list commands";
}

SZN.Shell.Command.Help.prototype.execute = function(argv, shell, keyCode) {
	var commands = shell.getCommands(SZN.Shell.COMMAND_STANDARD);
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
				var str = command.getNames().join(", ")+": " + h;
				shell.print(str);
			} else {
				shell.print("Command '"+c+"' has no help");
			}
		} else {
			shell.print("There is no command '"+c+"'");
		}
	} else {
		shell.print("Available commands:");
		var arr = [];
		for (var i=0;i<commands.length;i++) {
			var obj = commands[i][0];
			var str = obj.getNames().join(", ");
			var h = obj.getHelp();
			if (h) { str += ": "+h; }
			arr.push(str);
		}
		arr.sort();
		for (var i=0;i<arr.length;i++) {
			shell.print(arr[i]);
		}
	}
}

/**/

SZN.Shell.Command.History = SZN.ClassMaker.makeClass({
	NAME:"History",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:SZN.Shell.Command
});

SZN.Shell.Command.History.prototype.$constructor = function() {
	this.ptr = -1;
	this.stack = [];
	this.lastTyped = "";
	this.names = ["history"];
	this.help = "show history; clear it with 'clear' argument";
}

SZN.Shell.Command.History.prototype.getHooks = function() {
	return [
		{placement:SZN.Shell.COMMAND_PREPROCESS, method:"_key"},
		{placement:SZN.Shell.COMMAND_PREPROCESS, method:"_record"},
		{placement:SZN.Shell.COMMAND_STANDARD}
	];
}

SZN.Shell.Command.History.prototype._key = function(argv, shell, keyCode) {
	switch (keyCode) {
		case 38:
			if (this.ptr > 0) {
				this.ptr--;
				if (!this.lastTyped) {
					this.lastTyped = argv.join(" ");
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

SZN.Shell.Command.History.prototype._record = function(argv, shell, keyCode) {
	if (keyCode != 13) { return; }
	this.lastTyped = "";
	if (argv.length) {
		this.stack.push(argv.join(" "));
		this.ptr = this.stack.length;
	}
}

SZN.Shell.Command.History.prototype.execute = function(argv, shell, keyCode) {
	if (argv.length > 1 && argv[1] == "clear") {
		this.stack = [];
		this.ptr = -1;
		this.lastTyped = "";
		shell.print("History cleared");
	} else {
		shell.print("History:");
		for (var i=0;i<this.stack.length;i++) {
			shell.print(this.stack[i]);
		}
	}
}

/**/

SZN.Shell.Command.Exit = SZN.ClassMaker.makeClass({
	NAME:"Exit",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:SZN.Shell.Command
});

SZN.Shell.Command.Exit.prototype.$constructor = function() {
	this.names = ["quit", "exit", "bye"];
	this.help = "destroy shell & console";
}

SZN.Shell.Command.Exit.prototype.execute = function(argv, shell, keyCode) {
	shell.$destructor();
}

/**/

SZN.Shell.Command.ReloadCSS = SZN.ClassMaker.makeClass({
	NAME:"ReloadCSS",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:SZN.Shell.Command
});

SZN.Shell.Command.ReloadCSS.prototype.$constructor = function() {
	this.names = ["rcss"];
	this.help = "reload appended stylesheets";
}

SZN.Shell.Command.ReloadCSS.prototype.execute = function(argv, shell, keyCode) {
	var styles = [];
	var urls = [];
	var all = document.getElementsByTagName("link");
	var h = document.getElementsByTagName("head");

	if (h.length) {
		h = h[0];
	} else {
		return;
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
		var l = SZN.cEl("link");
		l.rel = "stylesheet";
		l.type = "text/css";
		l.href = urls[i]+"?"+Math.random();
		h.appendChild(l);
	}
}

/**/
