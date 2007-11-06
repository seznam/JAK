/**
 * @fileOverview
 * @name Symbol
 * @author Michael Mathews micmath@gmail.com
 * @url $HeadURL: https://jsdoc-toolkit.googlecode.com/svn/tags/jsdoc_toolkit-1.3.3/app/Symbol.js $
 * @revision $Id$
 * @license <a href="http://en.wikipedia.org/wiki/MIT_License">X11/MIT License</a>
 *          (See the accompanying README file for full details.)
 */

SYM = {
	OBJECT:			"OBJECT",
	FUNCTION:		"FUNCTION",
	CONSTRUCTOR:	"CONSTRUCTOR",
	VIRTUAL:		"VIRTUAL",
    EVENT:          "EVENT"
};

/**
	@class Represents an atomic unit of code.
	@constructor
*/
function Symbol(name, params, isa, comment) {
	this.name = name;
	this.params = (params || []);
	this.isa = (isa || SYM.OBJECT);
	this.type = "";
	this.alias = name;
	this.desc = "";
	this.classDesc = "";
	this.memberof = "";
	this.augments = [];
	this.inherits = [];
	this.properties = [];
	this.methods = [];
	this.file = {};
	this.returns = [];
	this.exceptions = [];
    this.events= [];
	this.doc = new Doclet(comment);
	
	// move certain data out of the tags and into the Symbol
	var overviews;
	if ((overviews = this.doc.getTag("overview")) && overviews.length) {
		var libraries;
		if ((libraries = this.doc.getTag("name")) && libraries.length) {
			this.name = libraries[0].desc;
			this.doc._dropTag("name");
		}
		else {
			this.name = Util.fileName(this.alias)
		}
		
		this.desc = overviews[0].desc;
		this.doc._dropTag("overview");
	}
	else {
		var descs;
		if ((descs = this.doc.getTag("desc")) && descs.length) {
			this.desc = descs[0].desc;
			this.doc._dropTag("desc");
		}
		
		var params;
		if ((params = this.doc.getTag("param")) && params.length) { // user defined params override those defined by parser
			this.params = params;
			this.doc._dropTag("param");
		}
		else { // promote parser params into DocTag objects
			for (var i = 0; i < this.params.length; i++) {
				this.params[i] = new DocTag("param "+this.params[i]);
			}
		}
		
		var constructors;
		if ((constructors = this.doc.getTag("constructor")) && constructors.length) {
			this.isa = SYM.CONSTRUCTOR;
			this.doc._dropTag("constructor");
		}
		
		var functions;
		if ((functions = this.doc.getTag("function")) && functions.length) {
			this.isa = SYM.FUNCTION;
			this.doc._dropTag("function");
		}
        
        var events;
		if ((events = this.doc.getTag("event")) && events.length) {
			this.isa = SYM.EVENT;
			this.doc._dropTag("event");
		}
		
		var methods;
		if ((functions = this.doc.getTag("method")) && functions.length) {
			this.isa = SYM.FUNCTION;
			this.doc._dropTag("method");
		}
		
		var names;
		if ((names = this.doc.getTag("name")) && names.length) {
			this.name = names[0].desc;
			this.doc._dropTag("name");
		}
		
		var properties;
		if ((properties = this.doc.getTag("property")) && properties.length) {
			for (var i = 0; i < properties.length; i++) {
				properties[i].alias = this.alias+"."+properties[i].name;
				this.properties.push(properties[i]);
			}
			this.doc._dropTag("property");
		}
		
		var returns;
		if ((returns = this.doc.getTag("return")) && returns.length) {
			for (var i = 0; i < returns.length; i++) {
				this.returns.push(returns[i]);
			}
			this.doc._dropTag("return");
		}
		
		var exceptions;
		if ((exceptions = this.doc.getTag("throws")) && exceptions.length) {
			for (var i = 0; i < exceptions.length; i++) {
				this.exceptions.push(exceptions[i]);
			}
			this.doc._dropTag("throws");
		}
		
		if (this.is("VIRTUAL")) this.isa = SYM.OBJECT;
		
		var types;
		if ((types = this.doc.getTag("type")) && types.length) {
			if (this.is("OBJECT"))
				this.type = (types[0].desc || ""); // multiple type tags are ignored
			this.doc._dropTag("type");
		}
		
		if (this.doc.getTag("static").length > 0) {
			this.isStatic = true;
			this.doc._dropTag("static");
		}
		
		if (this.doc.getTag("private").length > 0) {
			this.isPrivate = true;
			this.doc._dropTag("private");
		}
			
		var classes;
		if ((classes = this.doc.getTag("class")) && classes.length) {
			if (this.doc.getTag("static").length > 0) this.isStatic = true;
			this.isa = "CONSTRUCTOR"; // a class tag implies a conctuctor doclet
			
			this.classDesc += "\n"+classes[0].desc; // multiple class tags are concatenated
			if (this.desc == "") this.desc = this.classDesc; // the first class description will be used when there is no constructor description
			this.doc._dropTag("class");
		}
		
		var inherits;
		if ((inherits = this.doc.getTag("inherits")) && inherits.length) {
			for (var i = 0; i < inherits.length; i++) {
				this.inherits.push(inherits[i].desc);
			}
			this.doc._dropTag("inherits");
		}
		
		var augments;
		if ((augments = this.doc.getTag("augments")) && augments.length) {
			for (var i = 0; i < augments.length; i++) {
				this.augments.push(augments[i].desc);
			}
			this.doc._dropTag("augments");
		}
		
		Symbol.index[this.alias] = this;
	}
}

Symbol.index = {};

Symbol.prototype.is = function(what) {
    return this.isa === SYM[what];
}

/** Generate a comma separated list of the parameters. */
Symbol.prototype.signature = function() {
    var result = [];
    for (var i = 0; i < this.params.length; i++) {
    	if (this.params[i].name.indexOf(".") == -1) // config information does not appear in the signature
    		result.push(this.params[i].name);
    }
    return result.join(", ");
}

Symbol.prototype.hasMethod = function(name) {
    for (var i = 0; i < this.methods.length; i++) {
    	if (this.methods[i].name == name) return true
    }
    return false;
}

Symbol.prototype.hasEvent = function(name) {
    for (var i = 0; i < this.events.length; i++) {
    	if (this.events[i].name == name) return true
    }
    return false;
}

Symbol.prototype.hasProperty = function(name) {
    for (var i = 0; i < this.properties.length; i++) {
    	if (this.properties[i].name == name) return true
    }
    return false;
}

Symbol.prototype.getInheritedMethods = function(r) {
	var inherited = [];
	for(var i = 0; i < this.inherits.length; i++) {
		inherited.push(this.file.fileGroup.getSymbol(this.inherits[i]));
	}
	var result = this.methods.concat(inherited);
	for(var i = 0; i < this.augments.length; i++) {
		var contributer = this.file.fileGroup.getSymbol(this.augments[i]);
		if (contributer) {
			result = result.concat(contributer.getInheritedMethods(true));
		}
	}
	// remove overridden
	for (var i = 0; i < result.length; i++) {
		var j = i; 
		while (++j < result.length) {
			if (result[j].name == result[i].name) result.splice(j, 1);
		}
	}
	
	if (!r) { // not recursing
		var s = this;
		function notLocal(element, index, array) {
			return (!s.hasMethod(element.name));
		}
		result = result.filter(notLocal);
	}
	return result;
}
