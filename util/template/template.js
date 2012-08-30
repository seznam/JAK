/**
 * @overview JS šablonovací systém
 * @author zara
 */
 
/**
 * @class Šablona
 */
JAK.Template = JAK.ClassMaker.makeClass({
	NAME: "JAK.Template",
	VERSION: "1.0"
});

JAK.Template.TOKEN_LITERAL	= 0;
JAK.Template.TOKEN_VALUE	= 1;
JAK.Template.TOKEN_CTYPE	= 2;
JAK.Template.TOKEN_NOT		= 3;
JAK.Template.TOKEN_BLOCK	= 4;
JAK.Template.TOKEN_END		= 5;

JAK.Template.OPCODE_LITERAL	= 0;
JAK.Template.OPCODE_VALUE	= 1;
JAK.Template.OPCODE_BLOCK	= 2;
JAK.Template.OPCODE_NOT		= 3;
JAK.Template.OPCODE_CTYPE	= 4;

JAK.Template.CTYPE = {};

/* xml/html entity */
JAK.Template.CTYPE["text/xml"] = [
	[/&/g, "&amp;"],
	[/</g, "&lt;"],
	[/>/g, "&gt;"],
	[/'/g, "&apos;"], // '
	[/"/g, "&quot;"] // "
];
JAK.Template.CTYPE["text/html"] = JAK.Template.CTYPE["text/xml"];

/* js/json znaky */
JAK.Template.CTYPE["text/javascript"] = [
	[/\\/g, "\\\\"],
	[/\n/g, "\\\n"],
	[/\r/g, "\\\r"],
	[/\t/g, "\\\t"],
	[/"/g, "\\\""],
	[/'/g, "\\'"] // "
];
JAK.Template.CTYPE["application/javascript"] = JAK.Template.CTYPE["text/javascript"];
JAK.Template.CTYPE["application/json"] = JAK.Template.CTYPE["text/javascript"];


/**
 * Statická tovární metoda; vyrobí šablonu z (cachovaného) AST
 * @param {string} jsonString
 */
JAK.Template.fromJSON = function(jsonString) {
	var t = new this.constructor("");
	t.setData(JSON.parse("(" + jsonString + ")"));
}

/**
 * Statická tovární metoda; vyrobí šablonu z obsahu uzlu
 */
JAK.Template.fromNode = function(node) {
	var template = (node.textContent || node.innerText || node.text);
	return new this(template);
}

/**
 * @param {string} template
 */
JAK.Template.prototype.$constructor = function(template) {
	this._ast = [];
	
	this._grammar = {};
	this._grammar[JAK.Template.TOKEN_VALUE]	= /{{\s*([^@#\/!].*?)\s*}}/g;
	this._grammar[JAK.Template.TOKEN_CTYPE]	= /{{\s*@\s*(.*?)\s*}}/g;
	this._grammar[JAK.Template.TOKEN_NOT]	= /{{\s*!\s*(.*?)\s*}}/g;
	this._grammar[JAK.Template.TOKEN_BLOCK]	= /{{\s*#\s*(.*?)\s*}}/g;
	this._grammar[JAK.Template.TOKEN_END]	= /{{\s*\/(.*?)\s*}}/g;
	
	this._parse(template);
}

/**
 * @returns {array} data
 */
JAK.Template.prototype.getData = function() {
	return this._ast;
}

/**
 * Nastaví data šablony
 * @param {array} data
 */
JAK.Template.prototype.setData = function(data) {
	this._ast = data;
	return this;
}

/**
 * Serializace do JSONu
 * @returns {string}
 */
JAK.Template.prototype.toJSON = function() {
	return JSON.stringify(this._ast);
}

/**
 * Doplnit do šablony data
 * @param {?} context
 * @param {object} [options]
 */
JAK.Template.prototype.render = function(context, options) {
	var o = {
		contentType: "text/html"
	}
	for (var p in options) { o[p] = options[p]; }
	
	var ctx = {
		root: context,
		current: context,
		path: []
	}

	return this._processAST(this._ast, ctx, o);
}

/**
 * Rozsekání šablony na tokeny
 */
JAK.Template.prototype._parse = function(template) {
	this._ast = [];

	/* rozsekat na tokeny */
	var tokens = this._tokenize(template);

	/* postavit abstraktni syntakticky strom */
	this._buildAST(this._ast, tokens, "");
}

JAK.Template.prototype._tokenize = function(template) {
	var tokens = [];
	var matches = [];

	for (var type in this._grammar) { /* najit v sablone jednotlive tokeny */
		var re = this._grammar[type];
		type = parseInt(type);
		
		template = template.replace(re, function(match, value, index) {
			matches.push([type, value, index, match.length]);
			return match;
		});
	}

	matches.sort(function(a,b) { /* seradit matche podle poradi vyskytu */
		return a[2]-b[2];
	});
	
	var index = 0;
	while (index < template.length) { /* rozsekat sablonu na tokeny */
		var nextIndex = (matches.length ? matches[0][2] : template.length);
		
		if (nextIndex != index) { /* plain string */
			var token = [
				JAK.Template.TOKEN_LITERAL,
				template.substring(index, nextIndex)
			]
			tokens.push(token);
			index = nextIndex;
		}
		
		if (matches.length) {
			var match = matches.shift();
			var token = [
				match[0],
				match[1]
			];
			tokens.push(token);
			index += match[3];
		}
	}
	return tokens;
}

JAK.Template.prototype._buildAST = function(parent, tokens, blockName) {
	while (tokens.length) {
		var token = tokens.shift();
		switch (token[0]) {
			case JAK.Template.TOKEN_LITERAL:
				token[0] = JAK.Template.OPCODE_LITERAL;
				parent.push(token);
			break;
			
			case JAK.Template.TOKEN_VALUE:
				token[0] = JAK.Template.OPCODE_VALUE;
				parent.push(token);
			break;

			case JAK.Template.TOKEN_BLOCK:
			case JAK.Template.TOKEN_NOT:
			case JAK.Template.TOKEN_CTYPE:
				var name = token[1];
				var subtree = [];
				this._buildAST(subtree, tokens, name);				
				var result = [
					null,
					name,
					subtree
				];
				switch (token[0]) {
					case JAK.Template.TOKEN_BLOCK:	result[0] = JAK.Template.OPCODE_BLOCK; break;
					case JAK.Template.TOKEN_NOT:	result[0] = JAK.Template.OPCODE_NOT; break;
					case JAK.Template.TOKEN_CTYPE:	result[0] = JAK.Template.OPCODE_CTYPE; break;
				}

				parent.push(result);
			break;

			case JAK.Template.TOKEN_END:
				var name = token[1];
				if (name && name != blockName) {
					throw new Error("End tag mismatch: expected '"+blockName+"', got '" + name + "'");
				}
				return;
			break;
		}
	}

}

/**
 * Projit podmnozinu AST a doplnit data
 * @param {array} ast Kus AST
 * @param {object} context Data
 * @param {object} options
 */
JAK.Template.prototype._processAST = function(ast, context, options) {
	var result = "";

	for (var i=0;i<ast.length;i++) {
		var token = ast[i];
		
		switch (token[0]) {
			case JAK.Template.OPCODE_LITERAL:
				result += token[1];
			break;

			case JAK.Template.OPCODE_VALUE:
				var value = this._getValue(context, token[1], false);
				result += this._escape(value, options.contentType);
			break;

			case JAK.Template.OPCODE_BLOCK:
				/* vyrobit datovy kontext pro podstrom */
				var context2 = this._createContext(context, token[1]);
				var subtree = token[2];

				var value = context2.current || [];
				if (value instanceof Array) {
					context2.count = value.length; /* for _count */
					for (var j=0;j<value.length;j++) {
						context2.iteration = j; /* for _number, _first, _last */
						context2.current = value[j];
						result += this._processAST(subtree, context2, options);
					}
				} else {
					result += this._processAST(subtree, context, options);
				}
			break;

			case JAK.Template.OPCODE_NOT: /* negace */
				var value = !this._getValue(context, token[1], false);
				if (value) { result += this._processAST(token[2], context, options); }
			break;

			case JAK.Template.OPCODE_CTYPE: /* ctype */
				var o = {
					contentType: token[1]
				}
				result += this._processAST(token[2], context, o);
			break;
		}
	}
	return result;
}

/**
 * Ziskat hodnotu z datoveho kontextu
 * @param {object} context
 * @param {string} name
 * @param {bool} adjustContext Ma se upravit context.path, aby odpovidala aktualnimu umisteni?
 */
JAK.Template.prototype._getValue = function(context, name, adjustPath) {
	var reserved = ["_first", "_last", "_count", "_number"];
	if (reserved.indexOf(name) != -1) {
		switch (name) {
			case "_first": return (context.iteration == 0); break;
			case "_last": return (context.iteration +1 == context.count); break;
			case "_count": return context.count; break;
			case "_number": return context.iteration; break;
		}
		return;
	}

	var path = []; /* lokalni cesta v ramci aktualniho podstromu */
	var current = context.current;
	var pathRelativeToContext = true;
	
	var parts = name.split("/");
	for (i=0;i<parts.length;i++) {
		var part = parts[i];
		switch (part) {
			case "": /* jdeme uplne nahoru: zmena korene, prazdna cesta */
				path = [];
				current = context.root;
				pathRelativeToContext = false;
			break;
			
			case "..": /* jdeme o krok nahoru: musime zkratit cestu, mozna zmenit koren, kompletni resolve */
				if (path.length) { /* lze couvnout v ramci nasi cesty */
					path.pop();
					if (pathRelativeToContext) {
						current = this._resolvePath(context.current, path);
					} else {
						current = this._resolvePath(context.root, path);
					}
				} else if (pathRelativeToContext && context.path.length) { /* nelze couvnout, ale mame cestu nad sebou */
					pathRelativeToContext = false;
					for (var j=0;j<context.path.length-1;j++) { path.push(context.path[j]); } /* zkopirovat cestou nad nami, o jedna kratsi */
					current = this._resolvePath(context.root, path);
				} else { /* jsme uplne nahore, nic nedelame */
				}
			break;
			
			case ".": /* noop */
			case "this":
			break;
			
			default: /* pridat kus cesty, ziskat hodnotu */
				path.push(part);
				current = this._resolvePath(current, [part]);
			break;
		}
		
	}
	
	if (adjustPath) {
		if (pathRelativeToContext) { /* pripnout na konec context.path */
			while (path.length) { context.path.push(path.shift()); }
		} else { /* nahradit context.path */
			context.path = path;
		}
	}
	
	if (current === null || current === undefined) {
		return "";
	} else {
		return current;
	}
}

JAK.Template.prototype._resolvePath = function(root, path) {
	var current = root;
	for (var i=0;i<path.length;i++) {
		var part = path[i];
		if (current === null || current === undefined) {
		} else {
			current = current[part];
		}
	}
	return current;
}

JAK.Template.prototype._createContext = function(oldContext, name) {
	/* klon */
	var context = {};
	for (var p in oldContext) { context[p] = oldContext[p]; }

	/* zduplikovat cestu */
	context.path = [];
	for (var i=0;i<oldContext.path.length;i++) { context.path.push(oldContext.path[i]); }
	
	/* aktualizovat path */
	context.current = this._getValue(context, name, true);
	
	return context;
}

JAK.Template.prototype._escape = function(value, contentType) {
	value = value + "";
	var patterns = JAK.Template.CTYPE[contentType] || [];
	for (var i=0;i<patterns.length;i++) {
		var pattern = patterns[i];
		value = value.replace(pattern[0], pattern[1]);
	}
	return value;
}
