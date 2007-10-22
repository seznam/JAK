/**
 * image browser
 * @param {Object} container
 * @param {Object} data
 * @param {Object} options
 */
SZN.ImageBrowser = function(container, data, options) {
	this.eventsCache = new Object();
	this.links = new Array();
	this.thumbs = new Array();
	
	this.container = SZN.gEl(container);
	
	// default options
	this.options = {
		width: 640,
		height: 480,
		bigImage: 'big',
		smallImage: 'small',
		zoomLinkId: '',
		mainLinkId: '',
		shadowOffset: {
			top: 9,
			left: 10,
			bottom: 17,
			right: 16
		},
		contentCrop: {
			x: 18,
			y: 18
		}
	};
	this._setOptions(options);
	
	this.data = this._processData(data);
	this.init();
};

SZN.ImageBrowser.Name = 'ImageBrowser';
SZN.ClassMaker.makeClass(SZN.ImageBrowser);

/**
 * explicit constructor
 */
SZN.ImageBrowser.prototype.init = function() {
}

/**
 * show image
 * @param {Integer} id
 */
SZN.ImageBrowser.prototype.showImage = function(id) {
	this._getHtmlDialog();
	SZN.Dom.elementsHider(this.htmlWrapper, false, 'hide');
	this.changeImage(id);
}

/**
 * change image
 * @param {Integer} id
 */
SZN.ImageBrowser.prototype.changeImage = function(id) {
	this._deactiveImage(this.actualId);
	var image = this.data[id][this.options.bigImage];
	this.bigImage.style.marginTop = (this.options.height-image.height)/2 + 'px';
	this.bigImage.setAttribute('src', image.url);
	this.bigImage.setAttribute('width', image.width + 'px');
	this.bigImage.setAttribute('height', image.height + 'px');
	//this.bigImage.setAttribute('title', this.data[id].alt);
	this._activeImage(id);
	
	// force redraw (important in opera)
	this.htmlTable.style.border = '1px solid #000'
	this.htmlTable.style.border = 'none';
}

/**
 * set previous image
 * @return {Integer} id
 */
SZN.ImageBrowser.prototype.previousImage = function() {
	var prevId = (typeof this.data[this.actualId-1] != 'undefined') ? this.actualId-1 : this.data.length-1;
	this.changeImage(prevId);
	return prevId;
}

/**
 * set next image
 * @return {Integer} id
 */
SZN.ImageBrowser.prototype.nextImage = function() {
	var nextId = (typeof this.data[this.actualId+1] != 'undefined') ? this.actualId+1 : 0;
	this.changeImage(nextId);
	return nextId;
}

/**
 * close image browser dialog
 */
SZN.ImageBrowser.prototype.close = function() {
	SZN.Dom.elementsHider(this.htmlWrapper, false, 'show');
	this.htmlDialog.style.display = 'none';
}

/* private methods */

/**
 * set active image
 * @param {Object} id
 * @private
 */
SZN.ImageBrowser.prototype._activeImage = function(id) {
	this.actualId = id;
	if (typeof id != 'undefined' && typeof this.thumbs[id] != 'undefined') {
		this.thumbs[id].link.className = 'active';
		this._scrollThumbnail(id);
	}
}

/**
 * deactivate active image
 * @param {Object} id
 */
SZN.ImageBrowser.prototype._deactiveImage = function(id) {
	if (typeof id != 'undefined' && typeof this.thumbs[id] != 'undefined') {
		this.thumbs[id].link.className = '';
	}
}

/**
 * scroll current active picture to center
 * @param {Object} id
 */
SZN.ImageBrowser.prototype._scrollThumbnail = function(id) {
	var leftOffset = this.thumbs[id].getLeftOffset();
	
	// highlight active image
	this.activeThumb.style.width = (this.data[id][this.options.smallImage].width-4) + 'px';
	this.activeThumb.style.height = (this.data[id][this.options.smallImage].height-4) + 'px';
	this.activeThumb.style.left = leftOffset + 'px';
	
	this.htmlThumbs.scrollLeft = (leftOffset)-(this.options.width/2-this.data[id][this.options.smallImage].width/2);
}

/**
 * attach link (main picture)
 */
SZN.ImageBrowser.prototype._attachMainLink = function(id) {
	var link = SZN.gEl(this.options.mainLinkId);
	if (link != null) {
		this.mainImage = new this.ImageLink(this, link, id);
	}
}

/**
 * attach link (zoom icon)
 */
SZN.ImageBrowser.prototype._attachZoomLink = function(id) {
	var link = SZN.gEl(this.options.zoomLinkId);
	if (link != null) {
		this.mainImage = new this.ImageLink(this, link, id);
	}
}

/**
 * process input data
 * @param {Array} data
 */
SZN.ImageBrowser.prototype._processData = function(data) {
	if (this.container != null) {
		var imgLinks = this.container.getElementsByTagName('a');
	}
	var mainSet = false;
	for (var i=0,length=data.length; i<length; i++) {
		if (typeof imgLinks != 'undefined' && typeof imgLinks[i] != 'undefined')
			this.links[i] = new this.ImageLink(this, imgLinks[i], i);
		
		if (data[i].main) {
			mainSet = true;
			this._attachMainLink(i);
			this._attachZoomLink(i);
		}
		if (!mainSet) {
				this._attachMainLink(0);
				this._attachZoomLink(0);
		}
	}
	
	if(typeof data[0] != 'undefined') {
		this.smallImage = data[0][this.options.smallImage];
		this.bigImage = data[0][this.options.bigImage];
	}
	
	return data;
}

/**
 * get/create HTML dialog
 */
SZN.ImageBrowser.prototype._getHtmlDialog = function() {
	if (this.htmlDialog == null) {
		this.bigImage = SZN.IMG({'class': 'image-browser-image', 'alt': 'Klikni pro zav�en�', 'title': 'Klikni pro zav�en�'});
		this.eventsCache['big-close-link'] = SZN.events.addListener(this.bigImage, 'click', this, 'close', false, true);

		var links = this._getHtmlLinks();
		this.htmlThumbs = this._getHtmlThumbs();
		
		var width = (this.options.width+this.options.shadowOffset.left+this.options.shadowOffset.right);
		var height = (this.options.height+this._getHtmlThumbsHeight()+this.options.shadowOffset.top+this.options.shadowOffset.bottom+2);
		
		this.htmlTable = SZN.DIV({'class': 'image-browser-wrapper', 'style': 'width: '+width+'px; height: '+height+'px;'},
			SZN.TABLE({'class': 'image-browser-table'},
				SZN.TBODY(
					SZN.TR(
						SZN.TD({'class': 'shadow-top-left'}),
						SZN.TD({'class': 'shadow-top'}),
						SZN.TD({'class': 'shadow-top-right'})
					),
					SZN.TR(
						SZN.TD({'class': 'shadow-left'}),
						SZN.TD({'class': 'image-browser-main', 'style': 'width: '+(this.options.width-this.options.contentCrop.x)+'px; height: '+(this.options.height+this._getHtmlThumbsHeight()-this.options.contentCrop.y)+'px;'}),
						SZN.TD({'class': 'shadow-right'})
					),
					SZN.TR(
						SZN.TD({'class': 'shadow-bottom-left'}),
						SZN.TD({'class': 'shadow-bottom'}),
						SZN.TD({'class': 'shadow-bottom-right'})
					)
				)
			),
			SZN.DIV({
					'class': 'image-browser-container',
					'style': 'width: '+this.options.width+'px; height: '+this.options.height+'px; top: '+this.options.shadowOffset.top+'px; left: '+this.options.shadowOffset.left+'px'
				},
				this.bigImage,
				links.imgPrev, 
				links.imgNext, 
				links.imgClose
			),
			this.htmlThumbs				
		);
		this.htmlWrapper = SZN.DIV({'class': 'image-browser'});
		
		this.htmlDialog = SZN.DIV(this.htmlWrapper, this.htmlTable);
		document.body.appendChild(this.htmlDialog);
		SZN.events.addListener(window, 'resize', this, '_setPosition', false, true);
		SZN.events.addListener(window, 'scroll', this, '_setPosition', false, true);
		
		// disable event under dialog layer
		SZN.events.addListener(this.htmlDialog, 'mousedown', this, SZN.events.cancelDef, true, true);
	}
	
	this.htmlDialog.style.display = '';
	this._setPosition();
	return this.htmlDialog;
}

/**
 * set position of dialog
 */
SZN.ImageBrowser.prototype._setPosition = function() {

	this.htmlWrapper.style.width = document.body.offsetWidth + 'px';
	this.htmlWrapper.style.height = document.body.offsetHeight + 'px';
	
	var docSize = SZN.Dom.getDocSize();
	var scrollPos = SZN.Dom.getScrollPos();
	
	var tableLeft = (docSize.width-this.htmlTable.offsetWidth)/2+scrollPos.x;
	this.htmlTable.style.left = tableLeft + 'px';
	
	var tableTop = (docSize.height-this.htmlTable.offsetHeight)/2+scrollPos.y;
	this.htmlTable.style.top = tableTop + 'px';
}

/**
 * create thumbnail links
 */
SZN.ImageBrowser.prototype._getHtmlThumbs = function() {
	var attributes = {
		'class': 'image-browser-thumbs' ,
		'style': 'width: '+ this.options.width +'px; height: '+ this._getHtmlThumbsHeight() +'px; bottom: '+ this.options.shadowOffset.bottom+'px; left: '+this.options.shadowOffset.left+'px'
	};
	
	var offsetLeft = 0;
	var thumbs = SZN.DIV(attributes);
	for (var i=0, length=this.data.length; i<length; i++) {
		var imageData = this.data[i][this.options.smallImage];
		var attr = {
			'src': imageData.url,
			'width': imageData.width+'px',
			'height': imageData.height+'px',
			'alt': '',
			'title': this.data[i].alt
		};
		var image = SZN.IMG(attr);
		thumbs.appendChild(image);
		this.thumbs[i] = new this.ImageLink(this, image, i);
		this.thumbs[i].setLeftOffset(offsetLeft);
		offsetLeft += imageData.width;
	}
	
	// opera needs this - scrollbar issue
	if (SZN.browser.klient == 'opera') {
		var space = SZN.SPAN('');
		thumbs.appendChild(space);
	}
	
	this.activeThumb = SZN.DIV({'style': 'border: 2px solid #FF0000; position: absolute; top: 0' });
	thumbs.appendChild(this.activeThumb);
	return thumbs;
}

/**
 * get height of thumbnail toolbar
 */
SZN.ImageBrowser.prototype._getHtmlThumbsHeight = function() {
	if (typeof this._thumbHeight == 'undefined') {
		if (this.data.length > 1) {
			
			var maxHeight = 0;
			var width = 0;
			
			for(var i=0, length=this.data.length; i<length; i++) {
				width += this.data[i][this.options.smallImage].width;
				if (this.data[i][this.options.smallImage].height > maxHeight) {
					maxHeight = this.data[i][this.options.smallImage].height;
				}
			}
			// need scrollbar?
			if (this.options.width-width > 0) {
				this._thumbHeight = maxHeight;
			} else {
				this._thumbHeight = maxHeight+17;
			}
		} else {
				this._thumbHeight = 0;
		}
	}
	return this._thumbHeight;
}

/**
 * create control links (next, prev, close)
 */
SZN.ImageBrowser.prototype._getHtmlLinks = function() {
	var links = {
		imgPrev : SZN.SPAN({'class': 'image-browser-prev', 'alt': 'P�edchoz�', 'title': 'P�edchoz�'}),
		imgNext : SZN.SPAN({'class': 'image-browser-next', 'alt': 'Dal��', 'title': 'Dal��'}),
		imgClose : SZN.SPAN({'class': 'image-browser-close', 'alt': 'Zav��t', 'title': 'Zav��t'})
	};
	if (this.data.length == 1) {
		links.imgPrev.style.display = 'none';
		links.imgNext.style.display = 'none';
	}
	this.eventsCache['next-link'] = SZN.events.addListener(links.imgNext, 'click', this, 'nextImage', false, true);
	this.eventsCache['prev-link'] = SZN.events.addListener(links.imgPrev, 'click', this, 'previousImage', false, true);
	this.eventsCache['close-link'] = SZN.events.addListener(links.imgClose, 'click', this, 'close', false, true);
	return links;
}

/**
 * set option
 * @param {String|Integer} key
 * @param {Mixed} value
 */
SZN.ImageBrowser.prototype._setOption = function(key, value) {
	this.options[key] = value;
}

/**
 * set options
 * @param {Object} options
 */
SZN.ImageBrowser.prototype._setOptions = function(options) {
	for(key in options)
		this._setOption(key, options[key]);
}

/**
 * image link object
 * @param {Object} link
 * @param {Object} linkData
 */
SZN.ImageBrowser.prototype.ImageLink = function(ImageBrowser, link, id, type) {
	this.eventsCache = new Object();
	this.parent = ImageBrowser;
	this.link = link;
	this.id = id;
	
	switch (type) {
		case 'change':
			this._attachChange();
			break;
		default:
		case 'show':
			this._attachShow();
			break;
	}
}

SZN.ImageBrowser.prototype.ImageLink.Name = 'ImageLink';
SZN.ClassMaker.makeClass(SZN.ImageBrowser.prototype.ImageLink);

/**
 * show image
 * @param {Object} e
 */
SZN.ImageBrowser.prototype.ImageLink.prototype.showImage = function(e) {
	if (typeof e != 'undefined') {
		SZN.events.cancelDef(e);
	}
	this.parent.showImage(this.id);
}

/**
 * change image
 * @param {Object} e
 */
SZN.ImageBrowser.prototype.ImageLink.prototype.changeImage = function(e) {
	if (typeof e != 'undefined') {
		SZN.events.cancelDef(e);
	}
	this.parent.chageImage(this.id);
}

/**
 * attach link
 */
SZN.ImageBrowser.prototype.ImageLink.prototype._attachShow = function() {
	this.eventsCache[this.id] = SZN.events.addListener(this.link, 'click', this, 'showImage', false, true);
}

/**
 * attach link
 */
SZN.ImageBrowser.prototype.ImageLink.prototype._attachChange = function() {
	this.eventsCache[this.id] = SZN.events.addListener(this.link, 'click', this, 'changeImage', false, true);
}

SZN.ImageBrowser.prototype.ImageLink.prototype.setLeftOffset = function(leftOffset) {
	this._leftOffset = leftOffset;
}
SZN.ImageBrowser.prototype.ImageLink.prototype.getLeftOffset = function() {
	return this._leftOffset;
}