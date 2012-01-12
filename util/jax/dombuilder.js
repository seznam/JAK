JAX.DOMBuilder = JAK.ClassMaker.makeClass({
	NAME: "JAX.DOMBuilder",
	VERSION: "1.0"
});

JAX.DOMBuilder.VAR_FORMAT = "\\\{%\\\}";
JAX.DOMBuilder.FIRST_FORMAT = "\\\{:first\\\}";
JAX.DOMBuilder.LAST_FORMAT = "\\\{:last\\\}";
JAX.DOMBuilder.COUNTERN_FORMAT = "\\\{:number\\\}";
JAX.DOMBuilder.COUNTERI_FORMAT = "\\\{:index\\\}";
JAX.DOMBuilder.IF_FORMAT = "\\\{:if %\\\}(.*)\\\{\\\/\\\}";

JAX.DOMBuilder.FIRST_STRING = "first";
JAX.DOMBuilder.LAST_STRING = "last";

JAX.DOMBuilder.prototype.$constructor = function(doc) {
	this.doc = doc || document;
	this.decorating = true;
	this.frag = JAX.$$(document.createDocumentFragment());
	this.pointer = this.frag;
}

JAX.DOMBuilder.prototype.addTemplate = function ( template, data ) {
	var result = JAX.DOMBuilder.makeTemplate( template, data );
	this.addElement( result );
	return result;
}

JAX.DOMBuilder.prototype.addBox = function ( def, attrs ) {
	this.pointer = this.add( def, attrs );
	return this.pointer;
}

JAX.DOMBuilder.prototype.endBox = function ( ) {
	try{
		this.pointer = this.pointer.parentNode;
		return this.pointer;
	} catch(e){
		return null;
	}
}

JAX.DOMBuilder.prototype.addText = function ( txt ) {
	var elm = this.doc.createTextNode(txt);
	this.pointer.appendChild(elm);
	return elm;
}

JAX.DOMBuilder.prototype.add = function ( def, attrs ) {
	var elm = JAX.make( def, attrs||false, this.doc, !this.decorating );
	this.pointer.appendChild(elm);
	return elm;
}

JAX.DOMBuilder.prototype.addElement = function ( elm ) {
	this.pointer.appendChild(elm);
	return elm;
}

JAX.DOMBuilder.prototype.addBoxElement = function ( elm ) {
	this.pointer.appendChild(elm);
	this.pointer = elm;
	return elm;
}

JAX.DOMBuilder.prototype.getDom = function ( ) {
	return this.frag;
}

JAX.DOMBuilder.prototype.appendTo = function ( elm ) {
	if( typeof(elm) == "string" ){
		var elm = JAK.gel(elm);
	}
	if( !elm ){
		throw new Error("JAX.DOMBuilder.appendTo: 'elm' not found.");
	}
	elm.appendChild(this.frag);
}

/** Template **/
JAX.DOMBuilder.makeTemplate = function( templ, data ){
	if( typeof(templ) == "object" && templ instanceof HTMLElement ) {
		var templ = templ.innerHTML;
	} else if( typeof(templ) != "string" ) {
		throw new Error("Template should be 'string' or 'HTMLElement' not '"+typeof(templ)+"'.")
	}
	var result = "";
	var last = 0;
	if( typeof(data) == "object" && data instanceof Array ){
		for( var i = 0; i < data.length; i ++ ){
			last = (i==data.length-1)?1:0;
			result += JAX.DOMBuilder._processTemplate( templ, data[i], i, last );
		}
	} else {
		result = JAX.DOMBuilder._processTemplate( templ, data, 0, 1 );
	}
	var tempdiv = document.createElement("div");
	tempdiv.innerHTML = result;
	var nodes = JAK.DOM.arrayFromCollection(tempdiv.childNodes);
	var frag = document.createDocumentFragment();
	for( var i = 0; i < nodes.length; i ++ ){
		
		frag.appendChild( nodes[i] );
	}
	return frag;
}

JAX.DOMBuilder._processTemplate = function( templ, data, index, last ){
	var result = templ;
	var varformat = JAX.DOMBuilder.VAR_FORMAT;
	var ifformat = JAX.DOMBuilder.IF_FORMAT;
	var _format = null;
	for( var key in data ){
		_format = varformat.replace("%",key);
		result = result.replace( new RegExp( _format, "g" ), data[key] );
		_format = ifformat.replace("%",key);
		if( data[key] ){
			result = result.replace( new RegExp( _format, "g" ), "$1" );
		} else {
			result = result.replace( new RegExp( _format, "g" ), "" );
		}
	}
	var repl;
	result = result.replace( new RegExp( JAX.DOMBuilder.COUNTERN_FORMAT, "g" ), index+1 );
	result = result.replace( new RegExp( JAX.DOMBuilder.COUNTERI_FORMAT, "g" ), index );
	repl = ((index==0)?JAX.DOMBuilder.FIRST_STRING:"");
	result = result.replace( new RegExp( JAX.DOMBuilder.FIRST_FORMAT, "g" ), repl );
	repl = ((last==1)?JAX.DOMBuilder.LAST_STRING:"");
	result = result.replace( new RegExp( JAX.DOMBuilder.LAST_FORMAT, "g" ),repl );
	return result;
}


