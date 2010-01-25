/**
 * trida vytvarejici strom ze strukturovaneho predpisu. tento predpis muze vypadat jako v prikladu nize. Povinne je defakto
 * title a childNodes. Pokud neni zadana trida, jsou vsechny prvky vytvoreny jako potomci @see SZN.Tree.Node
 * @example
 * treedata = {
 *	title:'Kořen kategorií',
 *	id: 'root',
 *	nodeClass: SZN.Tree.Node,
 *	childNodes: [
 *			{
 *				id: 'tst29857',
 *				className:  'premise' ,
 *				title:'AAA (29857)',
 *				decorators:[{
 *					constructor:SZN.Tree.Node.Feature.AjaxExpand,
 *					params: {url: "/category/categoryTreeScreen?parentId=29857&state=AJAX_LIST"}
 *				},
 *				{
 *					constructor:SZN.Tree.Node.Feature.OpenForm,
 *					params: {url: '/category/categoryScreen?state=AJAX_DETAIL&id=29857'}
 *				}],
 *				childNodes: [],
 *				nodeClass: SZN.Tree.Node
 *			},
 *			{
 *				id: 'tst29835',
 *				className:  'link' ,
 *				title:'adfafsdf (29835)',
 *				childNodes: [],
 *				nodeClass: SZN.Tree.Leaf
 *			}
 *		]
 *	};
 *
 * @class
 * @name SZN.Tree.Builder
 */
SZN.Tree.Builder = SZN.ClassMaker.makeClass({
 	NAME: "SZN.Tree.Builder",
	VERSION: "1.0",
	CLASS: "class"
});

SZN.Tree.Builder.prototype.$constructor = function(data) {
	this.data = data;
	this.defaultNode = SZN.Tree.Node;
	this.defaultLeaf = SZN.Tree.Leaf;
};

/**
 * zakladni metoda pro vytvoreni stromu z predpisu, predpis je predan konstrutoru
 */
SZN.Tree.Builder.prototype.build = function() {
	var cl = this.data.nodeClass || this.defaultNode;
	var rootNode = new cl(null, {id:this.data.id, className: this.data.className, title:this.data.title, imgPath: this.data.imgPath, visualizer:this.data.visualizer});
	if (this.data.decorators) {
		for (var i =0; i < this.data.decorators.length; i++) {
			rootNode = rootNode.addFeature(this.data.decorators[i].constructor, this.data.decorators[i].params);
		}
		this._decorate(rootNode, this.data.decorators);
	}
	if (this.data.childNodes) {
		this.buildChildren(rootNode, this.data.childNodes);
	}
	return rootNode;
}

/**
 * metoda je volana z metody @see build, tvori poduzly, jde zavolat i samostatne pri dynamickem donacitani
 * @param {SZN.Tree.Node} parent
 * @param {array} data
 */
SZN.Tree.Builder.prototype.buildChildren = function(parent,data) {
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

SZN.Tree.Builder.prototype._decorate = function(node, data) {
   for (var j =0; j < data.length; j++) {
		node.decorate(data[j].constructor, data[j].params);
	}
}