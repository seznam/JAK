// tagName#id.class.class2
JAX.make = function(q,attrs,doc,nodecor){
	var attrs = attrs||false;
	var doc = doc || document;
	var def = JAX._queryparse(q);
	if( def.tag == "" ){
		throw new Error("JAX.make: Tag name is required.");
	}
	var elm = JAX._maker(doc,def.tag,attrs);
	if( !nodecor ){
		elm = JAX.$$(elm);
	}
	
	if( def.className.length ){
		elm.className = def.className.join(" ");
	}
	
	if( def.id ){
		elm.id = def.id;
	}
	
	if( attrs ){
		JAX.modify(elm,attrs);
	}
	
	return elm;
}

JAX._maker_ieattrs = ["target","enctype","method","type","name","action"];

JAX._maker = function(doc,tagname,attrs){
	var attrs = attrs||{};
	if( JAK.Browser.client == "ie" && JAK.Browser.version <= 8 ){
		var str = "<"+tagname+" ";
		for( var key in attrs ){
			if( JAX._maker_ieattrs.indexOf(key) != -1 ){
				str += key+"=\""+attrs[key]+"\" ";
			}
		}
		str += ">";
		var elm = doc.createElement(str);
	} else {
		var elm = doc.createElement(tagname);
	}
	return elm;
}

JAX.mmake = function(q,number,func,doc,nodecor){
	var _elms = [];
	var elm = null;
	for(var i = 0; i < number; i ++ ){
		elm = JAX.make(q,{},doc||document,nodecor||false);
		func(elm,i);
		_elms.push( elm );
	}
	return _elms;
}

JAX._elmAttrs = ["href","src","disabled","type","for","id","target","name"];
JAX._elmEvents = ["click","dblclick","mousedown","mouseup","mousemove","keydown","keyup","keypress","mouseover","mouseout"];
JAX._ElementAttributes = JAX._elmAttrs;
JAX._ElementEvents = JAX._elmEvents;

JAX._units = function(str){
	var str = str+"";
	if( str.indexOf("px") != -1 || str.indexOf("%") != -1){
		return str;
	}
	return str+"px";
}

JAX.modify = function(elm,attrs){
	if( !attrs ) return elm;
	for(var i in attrs){
		var v = attrs[i];
		if( JAX._elmEvents.indexOf(i) != -1 ){
			JAX.DecorateElement(elm);
			elm.event(i,v);
		}
	}
	for(var i in attrs){
		var v = attrs[i];
		if( JAX._elmAttrs.indexOf(i) != -1 ){
			try{elm.setAttribute(i,v);}catch(e){}
		} else if( JAX._elmEvents.indexOf(i) != -1 ){
			continue;
		} else if( i == "html" ){
			elm.innerHTML = v;
		} else if( i == "title" ){
			elm.setAttribute("title",v);
			elm.setAttribute("alt",v);
		} else if( i == "htmladd" ){
			elm.innerHTML += v;
		} else if( i == "position" ){
			elm.style.position = (v=="abs")?"absolute":( v=="rel"?"relative":v );
		} else if( i == "width" ){
			elm.style.width = JAX._units(v);
		} else if( i == "height" ){
			elm.style.height = JAX._units(v);
		} else if( i == "left" ){
			elm.style.left = JAX._units(v);
		} else if( i == "top" ){
			elm.style.left = JAX._units(v);
		} else if( i == "style" ){
			for( var s in attrs[i] ){ elm.style[s] = v[s]; }
		} else {
			elm[i] = v;
		}
	}
	return elm;
}

JAX._queryparse = function(query){
	var ob = {id:"",tag:"",className:[],pseudoClasses:[]};
	var e = "t";
	var ci = -1;
	var pi = -1;
	for(var n = 0; n < query.length; n ++ ){
		var chr = query.charAt(n);
		if(chr == "#"){ e="i"; continue; };
		if(chr == "."){ e="c"; if(ci>=0) ob.className[ci]+=" "; ci++; ob.className.push(" "); continue; };
		if(chr == ":"){ e="p"; pi++; ob.pseudoClasses.push(""); continue; };
		if(e=="c") ob.className[ci] += chr;
		if(e=="t") ob.tag += chr;
		if(e=="i") ob.id += chr;
		if(e=="p") ob.pseudoClasses[pi] += chr
	}
	return ob;
}

JAX._query_checkElm = function(elm,ob,index,count){
	if(elm.nodeType != 1) return false;
	var index = index||0;
	var count = count||1;
	if(ob.className){
		for(var c = 0; c < ob.className.length; c++ ){
			if((" "+elm.className+" ").indexOf(ob.className[c]) == -1) return false;
		}
	}
	if(ob.tag && elm.tagName.toLowerCase() != ob.tag.toLowerCase()) return false;
	if(ob.id != ""){
		if( typeof(elm.id) == "string" ){
			var _id = elm.getAttribute("id");
			if( !_id ) return false;
			if( _id.toLowerCase() != ob.id.toLowerCase() ) return false;
		} else {
			return false;
		}
	}
	if(ob.pseudoClasses){
		var pseudo;
		for(var c = 0; c < ob.pseudoClasses.length; c++ ){
			pseudo = ob.pseudoClasses[c];
			if(pseudo == "first" && index != 0) return false;
			if(pseudo == "even" && index % 2 == 0) return false;
			if(pseudo == "odd" && index % 2 != 0) return false;
			if(pseudo == "last" && index != count-1) return false;
		}
	}
	return true;
}


JAX.query = function(query,context){
	var context = context || document;
	//return context.querySelectorAll(query);
	
	// mam nekolik queries v jednom stringu
	if( query.indexOf(",") != -1 ){
		query = query.split(",");
		var nodes = [];
		var result = [];
		for( var i = 0; i < query.length; i ++ ){
			result = JAX.query(query[i],context);
			nodes = nodes.concat( result );
		}
		return nodes;
	}
	var working,elms,elm,el,_context,ob,work;
	
	// rozstrelim query na jednotlive kousky
	query = query.split(" ");
	// mam hotovou query; muzu prochazet uzly
	var elms_length;
	working = [context];
	for( var i = 0; i < query.length; i ++ ){
		// zpracovani jednoho kousku query
		ob = JAX._queryparse(query[i]);
		work = [];
		// projdu vyhovujici prvky
		for( var r = 0; r < working.length; r++ ){
			_context = working[r];
			if(ob.className.length != 0 && _context.getElementsByClassName){
				// pro prohlizece jez to podporuji pouzijeme nativni fci
				elms = _context.getElementsByClassName(ob.className[0]);
			} else {
				// pro ostatni budeme filtrovat vsechny elementy (nebo jen tagy)
				elms = _context.getElementsByTagName(ob.tag||"*");
			}
			elms_length = elms.length;
			for(var e = 0; e < elms_length; e++ ){
				// pokud element vyhovuje pak pokracuje dal
				if(JAX._query_checkElm(elms[e],ob,e,elms_length)){
					work.push( elms[e] );
				}
			}
		}
		working = work;
	}
	return working;
}


JAX.OffScreenMeter = function(elm){
	var result = {width:-1,height:-1};
	var copy = elm.cloneNode(true);
	var wrapper = document.createElement("div");
	wrapper.style.position = "absolute";
	wrapper.style.left = "-2000px";
	wrapper.style.top = "-2000px";
	document.body.insertBefore( wrapper, document.body.firstChild );
	wrapper.appendChild(copy);
	result.width = copy.offsetWidth;
	result.height = copy.offsetHeight;
	wrapper.parentNode.removeChild(wrapper);
	return result;
}


JAX._nodeWalk = function( node, query, dir ){
	var dir = dir || 1;
	var queryObject = JAX._queryparse(query);
	var elms = JAK.DOM.arrayFromCollection(document.getElementsByTagName("*"));
	var index = elms.indexOf(node);
	if(dir == 1){
		for(var i = index+1; i < elms.length; i ++ ){
			if(JAX._query_checkElm(elms[i],queryObject,0)){
				return JAX.$$(elms[i]);
			}
		}
	} else {
		for(var i = index-1; i >= 0; i -- ){
			if(JAX._query_checkElm(elms[i],queryObject,0)){
				return JAX.$$(elms[i]);
			}
		}
	}
	return false;
}
