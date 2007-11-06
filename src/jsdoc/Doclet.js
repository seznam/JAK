/**
 * @fileOverview
 * @name Doclet
 * @author Michael Mathews micmath@gmail.com
 * @url $HeadURL: https://jsdoc-toolkit.googlecode.com/svn/tags/jsdoc_toolkit-1.3.3/app/Doclet.js $
 * @revision $Id$
 * @license <a href="http://en.wikipedia.org/wiki/MIT_License">X11/MIT License</a>
 *          (See the accompanying README file for full details.)
 */
 
/**
 * @class Represents a collection of DocTags.
 * @constructor
 * @author Michael Mathews <a href="mailto:micmath@gmail.com">micmath@gmail.com</a>
 * @param {string} comment The entire documentation comment. The openening slash-star-star and
 * closing star-slash are optional. An untagged string at the start automatically gets a "desc" tag.
 */
function Doclet(comment) {
	if (!comment) comment = "/** @desc undocumented */";

	var src = comment.replace(/(^\/\*\*|\*\/$)/g, "").replace(/^\s*\* ?/gm, "");
	if (src.match(/^\s*[^@\s]/)) src = "@desc "+src;
	
	var tagTexts = src.split(/(^|[\r\f\n])\s*@/);
	
	this.tags =
		tagTexts.filter(function(el){return el.match(/^\w/)})
		.map(function(el){return new DocTag(el)});
	
	var paramParent = "config"; // default
	for(var i = 0; i < this.tags.length; i++) {
		if (this.tags[i].title == "param") paramParent = this.tags[i].name;
		if (this.tags[i].title == "config") {
			this.tags[i].name = paramParent+"."+this.tags[i].name;
			this.tags[i].title = "param"
		}
	}
}

/**
 * Get every DocTag with the given title.
 * @param {string} tagTitle
 * @return {DocTag[]}
 */
Doclet.prototype.getTag = function(tagTitle) {
	return this.tags.filter(function(el){return el.title == tagTitle});
}

/**
 * Remove from this Doclet every DocTag with the given title.
 * @private
 * @param {string} tagTitle
 */
Doclet.prototype._dropTag = function(tagTitle) {
	this.tags = this.tags.filter(function(el){return el.title != tagTitle});
}
