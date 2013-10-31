/**
 * @overview JS šablonovací systém
 * @author zara
 */

/* Ma fungovat i bez JAKu. */
if (!window.JAK) { window.JAK = {}; }
 
/**
 * @class Šablona
 */
JAK.Template = function() {
	return this.$constructor.apply(this, arguments);
}

JAK.Template.TOKEN_LITERAL	= 0;
JAK.Template.TOKEN_VALUE	= 1;
JAK.Template.TOKEN_CTYPE	= 2;
JAK.Template.TOKEN_NOT		= 3;
JAK.Template.TOKEN_BLOCK	= 4;
JAK.Template.TOKEN_END		= 5;
JAK.Template.TOKEN_INCLUDE	= 6;

JAK.Template.OPCODE_LITERAL	= 0;
JAK.Template.OPCODE_VALUE	= 1;
JAK.Template.OPCODE_BLOCK	= 2;
JAK.Template.OPCODE_NOT		= 3;
JAK.Template.OPCODE_CTYPE	= 4;
JAK.Template.OPCODE_INCLUDE	= 5;

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
	this._grammar[JAK.Template.TOKEN_VALUE]		= /{{([^@#\/!>].*?)\s*}}/g;
	this._grammar[JAK.Template.TOKEN_CTYPE]		= /{{@\s*(.*?)\s*}}/g;
	this._grammar[JAK.Template.TOKEN_NOT]		= /{{!\s*(.*?)\s*}}/g;
	this._grammar[JAK.Template.TOKEN_BLOCK]		= /{{#\s*(.*?)\s*}}/g;
	this._grammar[JAK.Template.TOKEN_END]		= /{{\/(.*?)\s*}}/g;
	this._grammar[JAK.Template.TOKEN_INCLUDE]	= /{{>\s*(.*?)\s*}}/g;
	
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
 * @param {?} data
 * @param {object} [options]
 * @param {string} [options.contentType="text/xml"]
 * @param {object} [options.include={}] Mapování include šablon (klíč = název, hodnota = instance JAK.Template)
 */
JAK.Template.prototype.render = function(data, options) {
	var o = {
		contentType: "text/html",
		include: {}
	}
	for (var p in options) { o[p] = options[p]; }
	
	return this._processAST(this._ast, data, o, []);
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

			case JAK.Template.TOKEN_INCLUDE:
				token[0] = JAK.Template.OPCODE_INCLUDE;
				parent.push(token);
			break;

			default:
				throw new Error("Unknown token encountered ("+token+")")
			break;
		}
	}

}

/**
 * Projit podmnozinu AST a doplnit data
 * @param {array} ast Kus AST
 * @param {?} data Data
 * @param {object} options
 * @param {array} path
 */
JAK.Template.prototype._processAST = function(ast, data, options, path) {
	var result = "";

	for (var i=0;i<ast.length;i++) {
		var token = ast[i];
		
		switch (token[0]) {
			case JAK.Template.OPCODE_LITERAL:
				result += token[1];
			break;

			case JAK.Template.OPCODE_VALUE:
				var fullPath = this._resolvePath(path, token[1]);
				var value = this._getValue(data, fullPath);
				result += this._escape(value, options.contentType);
			break;

			case JAK.Template.OPCODE_BLOCK:
				var blockPath = this._resolvePath(path, token[1]);
				var blockValue = this._getValue(data, blockPath) || [];

				if (blockValue instanceof Array) {
					for (var j=0;j<blockValue.length;j++) {
						var iterationPath = this._resolvePath(blockPath, j);
						result += this._processAST(token[2], data, options, iterationPath);
					}
				} else {
					result += this._processAST(token[2], data, options, path);
				}
			break;

			case JAK.Template.OPCODE_NOT: /* negace */
				var fullPath = this._resolvePath(path, token[1]);
				var value = !this._getValue(data, fullPath);
				if (value) { result += this._processAST(token[2], data, options, path); }
			break;

			case JAK.Template.OPCODE_CTYPE: /* ctype */
				var o = {
					contentType: token[1],
					include: options.include
				}
				result += this._processAST(token[2], data, o, path);
			break;

			case JAK.Template.OPCODE_INCLUDE: /* include, partial */
				var included = options.include[token[1]];
				if (!included) { throw new Error("Included template '"+token[1]+"' not available"); }

				var includedData = this._getValue(data, path);
				result += included.render(includedData, options);
			break;

			default:
				throw new Error("Unknown opcode encountered ("+token+")")
			break;
		}
	}
	return result;
}

/**
 * Spojit aktuální a novou cestu
 * @param {array} path
 * @param {string} newPath
 */
JAK.Template.prototype._resolvePath = function(oldPath, newPath) {
	var result = oldPath.slice();

	if (typeof(newPath) == "number") { /* iterace - jen pridame cislo na konec */
		result.push(newPath);
		return result;
	}

	var parts = newPath.split("/");

	while (parts.length) {
		var part = parts.shift();
		switch (part) {
			case "": /* jdeme uplne nahoru */
				result = [];
			break;
			
			case "..": /* jdeme o krok nahoru */
				var previous = result.pop();
				/* pokud jsme polozka pole, pak predchudce neni pole samotne, ale jeho rodic */
				if (typeof(previous) == "number") { result.pop(); }
			break;
			
			case ".": /* noop */
			case "this":
			break;
			
			default: /* pridat kus cesty, ziskat hodnotu */
				result.push(part);
			break;

		}
	}

	return result;
}

JAK.Template.prototype._getValue = function(data, path) {
	var current = data;
	if (current === null || current === undefined) { return ""; }

	var iterationIndex = -1;
	var iterationObject = null;

	for (var i=0;i<path.length;i++)	{
		var pathPart = path[i];

		switch (pathPart) {
			case "_first":
				return (iterationIndex == 0);
			break;

			case "_last":
				return (iterationObject && iterationObject.length == iterationIndex+1);
			break;

			case "_count":
				return (iterationObject ? iterationObject.length : 0);
			break;

			case "_number":
				return iterationIndex;
			break;

			default:
				current = current[pathPart];
				if (typeof(pathPart) == "number") { iterationIndex = pathPart; }
			break;
		}

		if (current instanceof Array) { iterationObject = current; }
		if (current === null || current === undefined) { return ""; }
	}
	return current;
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
