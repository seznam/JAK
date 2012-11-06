/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @namespace namespace pro vizualizatory
 * @group jak-widgets 
 */
JAK.Tree.Visualizer = JAK.ClassMaker.makeStatic({
 	NAME: "JAK.Tree.Visualizer",
	VERSION: "1.0"
});

/**
 * staticka metoda vracejici instanci vizualizatoru dle jejiho zadaneho jmena,
 * ktere hleda v tomto namespace. pokud nenajde, vraci instanci vizualizatoru Lines
 * @see JAK.Tree.Visualizer.Lines  
 * @static
 * @param name
 */
JAK.Tree.Visualizer.getInstance = function(name){
	var current = JAK.Tree.Visualizer.Lines;
	if (name && name in JAK.Tree.Visualizer){
		current = JAK.Tree.Visualizer[name];
	}

	if (!current._instance) {
		current._instance = new current();
	}                                            
	return current._instance;
}


/**
 * @class abstraktni trida visualizatoru urcujici rozhranni. trida je zaroven singletonem, to je zajisteno jeho konstruktorem.
 * instanci je vzdy nutne ziskavat pres metodu getInstance namespace JAK.Tree.Visualizer
 * @see JAK.Tree.Visualizer.getInstance
 * @group jak-widgets 
 * @abstract
 */
JAK.Tree.Visualizer.Default = JAK.ClassMaker.makeClass({
	NAME: 'JAK.Tree.Visualizer.Default',
	VERSION: '1.0'
});

JAK.Tree.Visualizer.Default._instance = null;

/**
 * @private
 */
JAK.Tree.Visualizer.Default.prototype.$constructor = function(){
	if (JAK.Tree.Visualizer.Default._instance) {
		alert('Vizualizator je singleton!');
	} else {
		JAK.Tree.Visualizer.Default._instance = this;
	}

}
/**
 * metodu volame pri prvni vizualizaci node
 * @param {JAK.Tree.Node} node
 */
JAK.Tree.Visualizer.Default.prototype.build = function(node){}
/**
 * metodu volame pri updatech stavu node 
 * @param {JAK.Tree.Node} node
 */
JAK.Tree.Visualizer.Default.prototype.update = function(node){}
/**
 * metoru volame pri destruovani node
 * @param node
 */
JAK.Tree.Visualizer.Default.prototype.destroy = function(node){}




/**
 * Vizualizátor stromu pomocí linek a rozbalovacích uzlů
 */
JAK.Tree.Visualizer.Lines = JAK.ClassMaker.makeClass({
	NAME: 'JAK.Tree.Visualizer.Lines',
	VERSION: '1.0',
	EXTEND: JAK.Tree.Visualizer.Default
});

JAK.Tree.Visualizer.Lines._instance = null;

JAK.Tree.Visualizer.Lines.prototype.$constructor = function(){
	if (JAK.Tree.Visualizer.Lines._instance) {
		alert('Vizualizator je singleton!');
	} else {
		JAK.Tree.Visualizer.Lines._instance = this;
	}

	this.baseUrl = 'img/';
	this.indent = "20px";

	this.defaultStyle_ul = {
		margin: '0px',
		padding: '0px', 
		listStyleType: 'none',
		display:'none'
	};

	this.defaultStyle_li = {
		display:'block',
		margin: '0px',
		padding: '0px',
		listStyleType: 'none'
	};
	
	this.defaultStyle_title = {
		 marginLeft: '5px'
	};
}

JAK.Tree.Visualizer.Lines.prototype.getBaseUrl = function(node) {
	if (node) {
		var data = node.data();
		if (data.imgPath) {
			return data.imgPath;
		}
	}
	return this.baseUrl;
}

JAK.Tree.Visualizer.Lines.prototype.getNodeCssClass = function(node) {
	var css = node.data().className || node.id();
	return css;
}

JAK.Tree.Visualizer.Lines.prototype.build = function(node){
	var nodeId = node.id();
	var nodeClassName = this.getNodeCssClass(node);
	var dom = {};
	var ec = [];
	
	var container = JAK.cel('li', this.getNodeCssClass(node), 'tree_node_'+nodeId);
	if (node.selected()) {
		JAK.DOM.addClass(container, 'selected');
	}
	dom.container = container;
	JAK.DOM.setStyle(container,this.defaultStyle_li);


	var span = JAK.cel('span', null, 'tree_span_'+nodeId);

	ec.push(JAK.Events.addListener(span,"click",function(){
			if (node._expanded) {
				node.collapse();
			} else {
				node.expand();
			}
		}));
	var span_inner = JAK.cel('span', null, 'tree_span_inner_'+nodeId);
	span_inner.style.paddingLeft = this.indent;
	if(node.nextSibling() == null){ //je posledni
		span.style.background = 'url('+this.getBaseUrl(node)+'tree_last.gif) left center no-repeat';
		container.style.background = 'url('+this.getBaseUrl(node)+'tree_line.gif) left top no-repeat';
	} else {
		span.style.background = 'url('+this.getBaseUrl(node)+'tree_vert.gif) left center no-repeat';
		container.style.background = 'url('+this.getBaseUrl(node)+'tree_line.gif) left center repeat-y';
	}


	span.appendChild(span_inner);

	// elementy pro ikonu a titulek
	var icon = JAK.cel('img', 'tree_icon', 'tree_icon_'+nodeId);
	if(node instanceof JAK.Tree.Leaf){
		icon.src = this.getBaseUrl(node)+'page.png';
	} else {
		icon.src = this.getBaseUrl(node)+'pack.png';
	}
	var title = JAK.cel('span', 'tree_title', 'tree_title_'+nodeId);
	JAK.DOM.setStyle(title, this.defaultStyle_title);
	title.innerHTML = node.data().title;
	ec.push(JAK.Events.addListener(title, 'click', function(){
			node.select();
		}));
	
	// aby se mi k elementum lepe pristupovalo
	dom.tree_span = span;
	dom.tree_span_inner = span_inner;
	dom.tree_icon = icon;
	dom.tree_title = title;


	span_inner.appendChild(icon);
	span_inner.appendChild(title);
	container.appendChild(span);

    //kategorie
	if(!(node instanceof JAK.Tree.Leaf)){
		var list = JAK.cel('ul', null, 'tree_list_'+nodeId);
		JAK.DOM.setStyle(list,this.defaultStyle_ul);
		list.style.paddingLeft = this.indent;
		dom.content = list;
		container.appendChild(list);
		JAK.DOM.addClass(container, 'category');

		span_inner.style.background = 'url('+this.getBaseUrl(node)+'tree_open.gif) left center no-repeat';
		
		//renderovani deticek
		var childNodes = node.childNodes();
		for (var i = 0; i <childNodes.length; i++) {
			var domNode = childNodes[i].visualize();
			dom.content.appendChild(domNode);
		}
		
	//uzel
	} else {
		JAK.DOM.addClass(container, 'leaf');
	}
	
	//ulozeni vsech potrebnych veci do nodu
	node.getUnknownData().dom = dom;
	node.getUnknownData().ec = ec;
	node.visualized(true);

	return container;
};


JAK.Tree.Visualizer.Lines.prototype.update = function(node){
	var nodeId = node.id();
	var nodeClassName = this.getNodeCssClass(node);
	var dom = node.getUnknownData().dom;

	//update titulky
	dom.tree_title.innerHTML = node.data().title;

	JAK.DOM.removeClass(dom.container, 'selected');
	if (node.selected()) {
		JAK.DOM.addClass(dom.container, 'selected');
	}

	if(node.nextSibling() == null){ //je posledni
		dom.tree_span.style.background = "url("+this.getBaseUrl(node)+"tree_last.gif) left center no-repeat";
		dom.container.style.background = "url("+this.getBaseUrl(node)+"tree_line.gif) left top no-repeat";
	} else {
		dom.tree_span.style.background = "url("+this.getBaseUrl(node)+"tree_vert.gif) left center no-repeat";
		dom.container.style.background = "url("+this.getBaseUrl(node)+"tree_line.gif) left top repeat-y";
	}

	if(node instanceof JAK.Tree.Leaf){

	} else {
		//renderovani deticek, ktere byly pridany za behu
		var childNodes = node.childNodes();
		for (var i = 0; i <childNodes.length; i++) {
			if (!childNodes[i].visualized()) {
				var domNode = childNodes[i].visualize();
				dom.content.appendChild(domNode);
			}
		}
		
		if(node.expanded()){
			dom.tree_span_inner.style.background = "url("+this.getBaseUrl(node)+"tree_close.gif) left center no-repeat";
			dom.content.style.display = '';
		} else {
			dom.tree_span_inner.style.background = "url("+this.getBaseUrl(node)+"tree_open.gif) left center no-repeat";
			dom.content.style.display = 'none';
		}
	}
};
	
JAK.Tree.Visualizer.Lines.prototype.destroy = function(node) {
	var d = node.getUnknownData();

	if (node.parentNode()) {
		var pd = node.parentNode().getUnknownData() ;
		if (d.dom && pd.dom) {
			pd.dom.content.removeChild(d.dom.content);
		}
		delete(pd);
	}

	if (d.dom) {
		for (var p in d.dom) {
			d.dom[p] = null;
		}
	}

	if (d.ec) {
		d.ec.forEach(JAK.Events.removeListener, JAK.Events);
	}
	delete(d);
};
