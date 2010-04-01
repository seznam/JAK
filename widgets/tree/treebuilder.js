/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class trida vytvarejici strom ze strukturovaneho predpisu. tento predpis muze vypadat jako v prikladu nize. Povinne je defakto
 * title a childNodes. Pokud neni zadana trida, jsou vsechny prvky vytvoreny jako potomci @see JAK.Tree.Node
 * @example
 * treedata = {
 *	title:'Kořen kategorií',
 *	id: 'root',
 *	nodeClass: JAK.Tree.Node,
 *	childNodes: [
 *			{
 *				id: 'tst29857',
 *				className:  'premise' ,
 *				title:'AAA (29857)',
 *				decorators:[{
 *					constructor:JAK.Tree.Node.Feature.AjaxExpand,
 *					params: {url: "/category/categoryTreeScreen?parentId=29857&state=AJAX_LIST"}
 *				},
 *				{
 *					constructor:JAK.Tree.Node.Feature.OpenForm,
 *					params: {url: '/category/categoryScreen?state=AJAX_DETAIL&id=29857'}
 *				}],
 *				childNodes: [],
 *				nodeClass: JAK.Tree.Node
 *			},
 *			{
 *				id: 'tst29835',
 *				className:  'link' ,
 *				title:'BBB (29835)',
 *				childNodes: [],
 *				nodeClass: JAK.Tree.Leaf
 *			}
 *		]
 *	};
 *
 * @group jak-widgets 
 * @name JAK.Tree.Builder
 */
JAK.Tree.Builder = JAK.ClassMaker.makeClass({
 	NAME: "JAK.Tree.Builder",
	VERSION: "1.0",
	CLASS: "class"
});

JAK.Tree.Builder.prototype.$constructor = function(data) {
	this.data = data;
	this.defaultNode = JAK.Tree.Node;
	this.defaultLeaf = JAK.Tree.Leaf;
};

JAK.Tree.Builder.prototype.$destructor = function() {
	this.data = null;
	delete(this.defaultNode);
	delete(this.defaultLeaf);
}

/**
 * zakladni metoda pro vytvoreni stromu z predpisu, predpis je predan konstrutoru
 */
JAK.Tree.Builder.prototype.build = function() {
	var cl = this.data.nodeClass || this.defaultNode;
	var rootNode = new cl(null, {id:this.data.id, className: this.data.className, title:this.data.title, imgPath: this.data.imgPath, visualizer:this.data.visualizer});
	if (this.data.decorators) {
		this._decorate(rootNode, this.data.decorators);
	}
	if (this.data.childNodes && rootNode instanceof this.defaultNode) {
		this.buildChildren(rootNode, this.data.childNodes);
	}
	return rootNode;
}

/**
 * metoda je volana z metody @see build, tvori poduzly, jde zavolat i samostatne pri dynamickem donacitani
 * @param {JAK.Tree.Node} parent
 * @param {array} data
 */
JAK.Tree.Builder.prototype.buildChildren = function(parent,data) {
	for(var i = 0; i < data.length; i++){
		var nodeData = data[i];
		var cl = nodeData.nodeClass || this.defaultNode;
		var node = new cl(parent, {id:nodeData.id, className: nodeData.className,  title:nodeData.title, imgPath: nodeData.imgPath,  visualizer:nodeData.visualizer});
		if (nodeData.decorators) {
			this._decorate(node, nodeData.decorators);
		}
		if (nodeData.childNodes && nodeData.childNodes.length > 0) {
			this.buildChildren(node, nodeData.childNodes);
		}
		parent.appendChild(node);
	}
}

JAK.Tree.Builder.prototype._decorate = function(node, data) {
   for (var j =0; j < data.length; j++) {
		node.decorate(data[j].constructor, data[j].params);
	}
}
