/**
 * @namespace
 * namespace pro vizualizatory
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
 * abstraktni trida visualizatoru urcujici rozhranni. trida je zaroven singletonem, to je zajisteno jeho konstruktorem.
 * instanci je vzdy nutne ziskavat pres metodu @see JAK.Tree.Visualizer.getInstance
 * @class
 * @abstract
 */
JAK.Tree.Visualizer.Default = JAK.ClassMaker.makeClass({
	NAME: 'JAK.Tree.Visualizer.Default',
	VERSION: '1.0',
	CLASS: 'class'
});

JAK.Tree.Visualizer.Default._instance = null;

/**
 * @private
 * @constructor
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
 * Vizualizátor stromu pomocí linek a rozbalovacích uzlů
 */
JAK.Tree.Visualizer.Lines = JAK.ClassMaker.makeClass({
	NAME: 'JAK.Tree.Visualizer.Lines',
	VERSION: '1.0',
	CLASS: 'class',
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
	}

	this.defaultStyle_li = {
		display:'block',
		margin: '0px',
		padding: '0px',
		listStyleType: 'none'
	};
}

JAK.Tree.Visualizer.Lines.prototype.getBaseUrl = function(node) {
	if (node) {
		var data = node.getData();
		if (data.imgPath) {
			return node.getData().imgPath;
		}
	}
	return this.baseUrl;
	 
}

JAK.Tree.Visualizer.Lines.prototype.build = function(node){
	var container = JAK.cel('li', node.className(), 'tree_node_'+node.id());
	if (node.selected()) {
		JAK.DOM.addClass(container, 'selected');
	}
	node.setContainer(container);
	JAK.DOM.setStyle(container,this.defaultStyle_li);


	var span = JAK.cel('span', null, 'tree_span_'+node.id());

	node.addAttachedEvent(JAK.Events.addListener(span,"click",node,"_expandCollapseClick"));
	var span_inner = JAK.cel('span', null, 'tree_span_inner_'+node.id());
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
	var icon = JAK.cel('img', null, 'tree_icon_'+node.id());
	if(node._self() instanceof JAK.Tree.Leaf){
		icon.src = this.getBaseUrl(node)+'page.png';
	} else {
		icon.src = this.getBaseUrl(node)+'pack.png';
	}
	var title = JAK.cel('span', null, 'tree_title_'+node.id());
	title.innerHTML = node.title();
	node.addAttachedEvent(JAK.Events.addListener(title, 'click', node,"_nameClick"));
	
	// aby se mi k elementum lepe pristupovalo
	node.getDom().tree_span = span;
	node.getDom().tree_span_inner = span_inner;
	node.getDom().tree_icon = icon;
	node.getDom().tree_title = title;


	span_inner.appendChild(icon);
	span_inner.appendChild(title);
	container.appendChild(span);

	if(!(node._self() instanceof JAK.Tree.Leaf)){
		var list = JAK.cel('ul', null, 'tree_list_'+node.id());
		JAK.DOM.setStyle(list,this.defaultStyle_ul);
		list.style.paddingLeft = this.indent;
		node.setContent(list);
		node.getDom().tree_list = list;
		container.appendChild(list);

		span_inner.style.background = 'url('+this.getBaseUrl(node)+'tree_open.gif) left center no-repeat';
	}
};


JAK.Tree.Visualizer.Lines.prototype.update = function(node){
	//update titulky
	node.getDom().tree_title.innerHTML = node.title();

	JAK.DOM.removeClass(node.getContainer(), 'selected');
	if (node.selected()) {
		JAK.DOM.addClass(node.getContainer(), 'selected');
	}

	if(node.nextSibling() == null){ //je posledni
		node.getDom().tree_span.style.background = "url("+this.getBaseUrl(node)+"tree_last.gif) left center no-repeat";
		node.getContainer().style.background = "url("+this.getBaseUrl(node)+"tree_line.gif) left top no-repeat";
	} else {
		node.getDom().tree_span.style.background = "url("+this.getBaseUrl(node)+"tree_vert.gif) left center no-repeat";
		node.getContainer().style.background = "url("+this.getBaseUrl(node)+"tree_line.gif) left top repeat-y";
	}

	if(node._self() instanceof JAK.Tree.Leaf){

	} else {
		if(node.expanded){
			node.getDom().tree_span_inner.style.background = "url("+this.getBaseUrl(node)+"tree_close.gif) left center no-repeat";
			node.getContent().style.display = '';
		} else {
			node.getDom().tree_span_inner.style.background = "url("+this.getBaseUrl(node)+"tree_open.gif) left center no-repeat";
			node.getContent().style.display = 'none';
		}
	}

};
