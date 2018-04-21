/**
 *        /\
 *  _____//\\    _____
 *  _____/  \\  /_____
 *           \\//
 *            \/
 *
 * @overview grafy
 * @version 1.9
 * @author zara, majak
 */

JAK.Chart = JAK.ClassMaker.makeClass({
	NAME: "JAK.Chart",
	VERSION: "1.9"
});

/**
 * @constructor
 * @param {element} obj - element do ktereho budeme graf vkladat
 * @param {object} data - objekt s daty pro zobrazení grafu
 * @param {object} options - objekt s nastavením grafu
 */
JAK.Chart.prototype.$constructor = function(obj, data, options) {
	this._mergeOptions(this.options, options);

	this.legend = {
		left: 0,
		top: 0,
		width: 0,
		height: 0,
		reduceWidth: 0,
		reduceHeight: 0,
		reduceLabelFromTop: 0,
		reduceLabelFromLeft: 0
	};

	this._scrollTimeout = null;

	if ( this.options.legendShow || this.options.noteShow ) {
		this._precountLegend()
	};

	this._origData = JSON.parse(JSON.stringify(data));
	if ( this.options.items && this.options.items.length > 0 ) { this.origItems = JSON.parse(JSON.stringify(this.options.items)); }

	this._data = data;
	if ( this.__insertToChart ) {
		this._b = this._backend = this.__insertToChart._b;
		this._parentElm = this.__insertToChart._parentElm;
	}
	else {
		var reduceHeight = ( this.options.zoomable ) ? ( this.options.previewGraph.height + this.options.previewGraph.paddingFromGraph ) : 0;

		this._b = this._backend = new this.options.backend(( this.options.width - this.legend.reduceWidth ), ( this.options.height - this.legend.reduceHeight + reduceHeight ), this.options);
		this._parentElm = obj;

		JAK.DOM.setStyle(this._parentElm, {
			width: ( this.options.width ) + "px",
			height: ( this.options.height + this.legend.reduceHeight + reduceHeight ) + "px",
			position: "relative"
		});
	}

	this._compute();

	if ( this.__insertToChart ) {
		this._recountParentChart();
		this._drawToGraph();
	}
	else { this._draw(); }
}

/**
 *
 */
JAK.Chart.prototype.$destructor = function() {
	JAK.DOM.clear(this._parentElm);

	if ( this._ev && this._ev.length ) {
		while(this._ev.length) {this.removeListener(this._ev.pop())}
	}

	if ( this._b._ev && this._b._ev.length ) {
		while(this._b._ev.length) {JAK.Events.removeListener(this._b._ev.pop())}
	}
}

/**
 * skrolovani mysi
 * @param {object} e - udalost
 */
JAK.Chart.prototype._scroll = function(e) {
	if ( this._eventInGraph() || this._eventInPreviewGraph() ) {

		JAK.Events.stopEvent(e);
		JAK.Events.cancelDef(e);

		var delta = e.wheelDelta || e.detail;
		if (JAK.Browser.client == "gecko") { delta = -delta; }

		if(delta > 0) {
			this._zoomIn(e);
		} else {
			this._zoomOut(e);
		}

		return false;
	}
}

/**
 * dvojklik mysi
 * @param {object} e - udalost
 */
JAK.Chart.prototype._doubleClick = function(e) {
	JAK.Events.stopEvent(e);
	JAK.Events.cancelDef(e);

	if ( this.options.zoomable && ( this._eventInGraph() || this._eventInPreviewGraph() ) ) {
		return false;
	}
}

/**
 * klik na note
 * @param {object} e - udalost
 * @param {object} elm - element na kterem byla udalost vyvolana
 */
JAK.Chart.prototype._noteClick = function(e, elm) {
	JAK.Events.stopEvent(e);
	JAK.Events.cancelDef(e);

	if ( (/label-/).test(elm.id) ) {
		var label = JAK.gel(elm.id.replace("label-","")),
			scrollFromTop = elm.offsetTop;

		this._moveGraph((this._graphMove - parseInt(label.style.left)) * -1);

		this.legend.elm.scrollTop = scrollFromTop;

	}
	else {
		var actualLi = JAK.gel("label-" + elm.id),
			scrollFromTop = actualLi.offsetTop;

		actualLi.parentNode.parentNode.scrollTop = scrollFromTop;
	}

}

/**
 * prejeti mysi na note
 * @param {object} e - udalost
 * @param {object} elm - element na kterem byla udalost vyvolana
 */
JAK.Chart.prototype._noteOver = function(e, elm) {
	var noteLabel = null;

	if ( (/label-/).test(elm.id) ) {
		var noteLabelId = elm.id.replace("label-","");
		noteLabel = JAK.gel(noteLabelId);
	}
	else {
		noteLabel = elm;
		elm = JAK.gel("label-" + elm.id);
	}

	JAK.DOM.addClass(noteLabel, "activeNote");
	JAK.DOM.addClass(elm,"strong");
}

/**
 * prejeti mysi z note
 * @param {object} e - udalost
 * @param {object} elm - element na kterem byla udalost vyvolana
 */
JAK.Chart.prototype._noteOut = function(e, elm) {
	var noteLabel = null;

	if ( (/label-/).test(elm.id) ) {
		var noteLabelId = elm.id.replace("label-","");
		noteLabel = JAK.gel(noteLabelId);
	}
	else {
		noteLabel = elm;
		elm = JAK.gel("label-" + elm.id);
	}

	JAK.DOM.removeClass(noteLabel, "activeNote");
	JAK.DOM.removeClass(elm,"strong");
}

/**
 * prejeti mysi na scrollovaci buttonek
 * @param {object} e - udalost
 * @param {object} elm - element na kterem byla udalost vyvolana
 */
JAK.Chart.prototype._scrollButtonOver = function (e, elm) {
	if ( JAK.DOM.hasClass(elm, "scrollButtonLeft") || JAK.DOM.hasClass(elm, "scrollButtonRight") )
	JAK.DOM.setStyle(elm,{
		cursor: "col-resize"
	});
}

/**
 * prejeti mysi ze scrollovaciho buttonku
 * @param {object} e - udalost
 * @param {object} elm - element na kterem byla udalost vyvolana
 */
JAK.Chart.prototype._scrollButtonOut = function (e, elm) {
	JAK.DOM.setStyle(elm,{
		cursor: "auto"
	});
}

/**
 * udalost vyvolana pri stisknuti scrollovaciho buttonku
 * @param {object} e - udalost
 * @param {object} elm - element na kterem byla udalost vyvolana
 */
JAK.Chart.prototype._scrollButtonDown = function (e, elm) {
	this._b.makeEvent("mouseDown", {originalEvent: e, id: e.target.id});
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
}

/**
 * udalost vyvolana pri stisknuti scrollovaciho buttonku
 * @param {object} e - udalost
 * @param {object} elm - element na kterem byla udalost vyvolana
 */
JAK.Chart.prototype._scrollButtonUp = function (e, elm) {
	this._b.makeEvent("mouseUp", {originalEvent: e, id: e.target.id});
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
}

/**
 * udalost vyvolana pri pohybovani scrollovaciho buttonku
 * @param {object} e - udalost
 * @param {object} elm - element na kterem byla udalost vyvolana
 */
JAK.Chart.prototype._scrollButtonMove = function (e, elm) {
	this._b.makeEvent("canvasMouseMove", {originalEvent: e, id: e.target.id});
}

/**
 * spojeni dvou obejktu s optionama
 * @param {object} oldData - objekt jehoz data budou prepsana novym objektem
 * @param {object} newData - objekt jehoz data budou zachovana
 */
JAK.Chart.prototype._mergeOptions = function(oldData, newData) {
	for ( var p in newData ) {
		var newVal = newData[p];
		if ( typeof(newVal) == "object" && !(newVal instanceof Array) && newVal !== null ) {
			if ( !oldData[p] ) { oldData[p] = {}; }
			arguments.callee( oldData[p], newData[p] );
		} else {
			oldData[p] = newVal;
		}
	}
}

/**
 * posunuti grafu na danou pozici
 * @param {integer} toPosition - na jakou pozici se ma graf posunout
 */
JAK.Chart.prototype._moveGraph = function(toPosition) {
	this._graphMove = ( toPosition - this._c.graphWidth / 2 ) * -1;

	if ( this._activePointGroup ) {
		for ( var i = 0; i < this._activePointGroup.length; i++ ) { JAK.DOM.clear(this._activePointGroup[i][1]); }
	}

	this._compute();
	this._redrawing = true;
	this._moveZoomableMaskPreview();
	this._draw();

	if ( this.includeGraph ) {
		for ( var i = 0; i < this.includeGraph.length; i ++ ) {
			this.includeGraph[i]._compute();
			this.includeGraph[i]._redrawing = true;
			this.includeGraph[i]._draw();
			this.includeGraph[i]._redrawing = false;
		}
	}

	this._redrawing = false;
}

/**
 * zazoomovani grafu
 * @param {object} e - udalost
 */
JAK.Chart.prototype._zoomIn = function(e) {
	var callback = this.options.callback;
	this._zoomLevel += this.options.zoomStep;
	this._zoomType = -1;
	this._zoom(e);
	if ( callback.zoomIn && callback.zoomIn.method ) {
		if ( !callback.zoomIn.obj ) { callback.zoomIn.obj = window; }
		callback.zoomIn.obj[callback.zoomIn.method](e.data.originalEvent);
	}
};

/**
 * odzoomovani grafu
 * @param {object} e - udalost
 */
JAK.Chart.prototype._zoomOut = function(e) {
	if ( this._zoomLevel > 0 ) {
		var callback = this.options.callback;
		this._zoomLevel -= this.options.zoomStep;
		if ( this._zoomLevel < 0 ) { this._zoomLevel = 0; }
		this._zoomType = 1;
		this._zoom(e);
		if ( callback.zoomOut && callback.zoomOut.method ) {
			if ( !callback.zoomOut.obj ) { callback.zoomOut.obj = window; }
			callback.zoomOut.obj[callback.zoomOut.method](e.data.originalEvent);
		}
	}
};

/**
 * zobrazeni elementu
 * @param {object} e - udalost
 * @param {object} elm - element, jenz se ma zobrazit
 */
JAK.Chart.prototype._showElm = function(e, elm) {
	if ( elm ) { elm.style.display = "block"; }
}

/**
 * skryti elementu
 * @param {object} e - udalost
 * @param {object} elm - element, jenz se ma skryt
 */
JAK.Chart.prototype._hideElm = function(e, elm) {
	if ( elm ) { elm.style.display = "none"; }
}

/**
 * vlozeni grafu do stranky (elementu, ktery jsme grafovatku predali)
 */
JAK.Chart.prototype._insertToPage = function() {
	this._parentElm.appendChild(this._b._canvas);
}

/**
 * zkontroluje zda pozice myši je na samotném grafu
 */
JAK.Chart.prototype._eventInGraph = function() {
	var c = this._computed,
		coords = JAK.DOM.getBoxPosition(this._parentElm),
		left = this._lastMouseMove.clientX,
		top = this._lastMouseMove.clientY,
		scroll = JAK.DOM.getBoxScroll(this._parentElm);

	coords.left += c.left;
	coords.top += c.top;
	coords.right = c.graphWidth + coords.left;
	coords.bottom = c.graphHeight + coords.top;

	var x = left + scroll.x,
		y = top + scroll.y;

	return ( x < coords.right && x > coords.left && y < coords.bottom && y > coords.top );
};

/**
 * zkontroluje zda pozice myši je na okne preview grafu
 */
JAK.Chart.prototype._eventInMaskOnPreviewGraph = function() {
	var c = this._computed,
		coords = JAK.DOM.getBoxPosition(this._parentElm),
		left = this._lastMouseMove.clientX,
		top = this._lastMouseMove.clientY,
		scroll = JAK.DOM.getBoxScroll(this._parentElm),
		mask = this._zoomableMaskPreviewGroup[1].childNodes[0];

	coords.leftMask = coords.left + parseInt(mask.getAttribute("x"));
	coords.topMask = coords.top + parseInt(mask.getAttribute("y"));
	coords.rightMask = coords.leftMask + parseInt(mask.getAttribute("width"));
	coords.bottomMask = coords.topMask + parseInt(mask.getAttribute("height")) + 13;

	coords.topMask += parseInt(mask.getAttribute("height"));
	coords.bottomMask = coords.topMask + 13;

	var x = left + scroll.x,
		y = top + scroll.y;

	return ( x < coords.rightMask && x > coords.leftMask && y < coords.bottomMask && y > coords.topMask );
};

/**
 * zkontroluje zda pozice myši je na preview grafu
 */
JAK.Chart.prototype._eventInPreviewGraph = function() {
	var c = this._computed,
		coords = JAK.DOM.getBoxPosition(this._parentElm),
		left = this._lastMouseMove.clientX,
		top = this._lastMouseMove.clientY,
		scroll = JAK.DOM.getBoxScroll(this._parentElm);

	coords.leftMask = coords.left + c.left;
	coords.topMask = coords.top + c.top + c.graphHeight + this.options.previewGraph.paddingFromGraph;
	coords.rightMask = coords.leftMask + c.graphWidth;
	coords.bottomMask = coords.topMask + this.options.previewGraph.height;

	var x = left + scroll.x,
		y = top + scroll.y;

	return ( x < coords.rightMask && x > coords.leftMask && y < coords.bottomMask && y > coords.topMask );
};

/**
 * Zkontroluje zda pozice myši je na skrolovacich buttonech (porovnani id)
 * @param {string} id - id elementu
 */
JAK.Chart.prototype._eventInscrollButtons = function(id) {
	var changeWidth = false;
	if ( id == this._scrollBarGroup[2][0].id ) { changeWidth = 1; }
	if ( id == this._scrollBarGroup[2][1].id ) { changeWidth = 2; }

	return changeWidth;
};

/**
 * priprava dat
 * @param {object} data - data grafu
 */
JAK.Chart.prototype._prepareData = function(data) {
	var newData = [];
	if ( data[0].data ) { newData.push(data); }
	else { newData = data; }
	return newData;
}

/**
 * aplikuje colormapu a vrati vybranou barvu
 * @param {integer} index - index/poradi skupiny
 * @param {integer} numberOfColor - kolik bude potreba barev (pocet skupin)
 */
JAK.Chart.prototype._colorMap = function(index, numberOfColor) {
	var selectColor = null,
		index = index + ( numberOfColor || 0 ),
		numberOfColor = this._data.length + ( numberOfColor || 0 ),
		sectorColors = this.options.sectorColors,
		colorsMap = this.options.colorsMap;

	if ( sectorColors.length == 1 ) {
		selectColor = sectorColors[0];
	}
	else if ( numberOfColor <= colorsMap.length ) {
		selectColor = sectorColors[colorsMap[numberOfColor-1][index]];
	}
	else {
		var tmpI = index;

		while ( tmpI >= sectorColors.length ) {
			tmpI = tmpI - sectorColors.length;
		}

		selectColor = sectorColors[colorsMap[colorsMap.length-1][tmpI]];
	}
	return selectColor;
}

/**
 * vypocet grafu
 */
JAK.Chart.prototype._compute = function() {}

/**
 * ypocet prirustkoveho grafu - prepocet hodnot souctem predchozich
 */
JAK.Chart.prototype._computeIncrement = function() {
	var deactiveGroup = 0,
		dataLength = this._data.length,
		options = this.options;

	for ( var i = 0; i < dataLength; i++ ) {
		var item = options.items[i];
		if ( item && item.deactive ) {
			deactiveGroup++;
			continue;
		}
		var data = this._data[i],
			prevData = this._data[i-1-deactiveGroup] || null;
		deactiveGroup = 0;
		if ( prevData === null ) { continue; }
		if ( data.length > 0 && prevData.length > 0) {
			for ( var x = 0; x < data.length; x++ ) {
				data[x].size = data[x].data || "";
				data[x].data = data[x].data + ( prevData[x] ? prevData[x].data : 0 );
			}
		}
		else if ( prevData.length > 0 ) {
			this._data[i] = JSON.parse(JSON.stringify(prevData));
		}
	}
}

/**
 * vykresleni grafu
 */
JAK.Chart.prototype._draw = function() {}

/**
 * vypocet hodnot legendy
 */
JAK.Chart.prototype._precountLegend = function() {
	var legend = this.legend,
		options = this.options;
	legend.width = options.legendWidth;
	legend.height = options.legendHeight;

	switch (options.legendPosition) {
		case "left":
			legend.left = options.padding / 2;
			legend.top = Math.round((options.height - legend.height + ( options.zoomable ? ( options.previewGraph.paddingFromGraph + options.previewGraph.height ) : 0 )) / 2);
			legend.reduceWidth = legend.width;
			legend.reduceLabelFromLeft = -1 * legend.width;
		break;
		case "top":
			legend.left = Math.round((options.width - legend.width) / 2);
			legend.top = options.padding / 2;
			legend.reduceHeight = legend.height;
			legend.reduceLabelFromTop = -1 * legend.height;
		break;
		case "bottom":
			legend.left = Math.round((options.width - legend.width) / 2);
			legend.top = options.height - options.padding / 2 - legend.height;
			legend.reduceHeight = legend.height;
			legend.reduceLabelFromTop = legend.height;
		break;
		default:
			legend.left = options.width - options.padding / 2 - legend.width;
			legend.top = Math.round((options.height - legend.height + ( options.zoomable ? ( options.previewGraph.paddingFromGraph + options.previewGraph.height ) : 0 )) / 2);
			legend.reduceWidth = legend.width;
			legend.reduceLabelFromLeft = legend.width;
		break;
	}
}

/**
 * vykresleni legendy
 * @param {object} data - data grafu
 * @param {object} note - volitelny parametr, zda se jedna o note
 */
JAK.Chart.prototype._drawLegend = function(data, note) {
	this.legendElm = JAK.mel("div", {className: "chartLegend"});
	var noteType = (note && note.length > 0) ? true : false,
		options = this.options,
		legend = this.legend,
		dataLength = data.length;

	JAK.DOM.setStyle(this.legendElm, {
		width: options.legendWidth + "px",
		height: options.legendHeight + "px",
		overflow: "auto",
		position: "absolute",
		top: legend.top + "px",
		left: legend.left + "px",
		zIndex: 200
	});

	var legendList = JAK.cel("ul"),
		legendListItem = null;

	for ( var i = 0; i < dataLength; i++ ) {
		if ( this._groups[i] && !noteType ) {
			legendList.appendChild(this._addItemToLegend(data[i], i));
		}
		else if ( noteType ) {
			if ( data[i].hide ) { continue; }
			var nodeitemToLegend = this._addNoteToLegend(data[i], i);
			JAK.DOM.addClass(nodeitemToLegend, "note clr");
			legendList.appendChild(nodeitemToLegend);
		}
	}

	this.legendElm.appendChild(legendList);
	this._parentElm.appendChild(this.legendElm);

	return this.legendElm;
}

/**
 * pridani polozky do legendy
 * @param {object} sector - sector ke kteremu bude polozka prirazena
 * @param {integer} i - poradi polozky
 */
JAK.Chart.prototype._addItemToLegend = function (sector, i) {
	var legendListItem = JAK.cel("li"),
		legendListItemHref = JAK.mel("a", {href: "#"}),
		legendListItemColor = JAK.cel("span"),
		options = this.options;

	if ( sector.label ) { legendListItemHref.innerHTML = sector.label; }
	else if ( sector.content ) { legendListItemHref.innerHTML = sector.content; }

	JAK.DOM.setStyle(legendListItemColor, {
		display: "block",
		width: options.legendColorWidth + "px",
		height: options.legendColorHeight + "px",
		backgroundColor: this._colorMap(i)
	});

	legendListItem.setAttribute("id", "label-" + this._groups[i][0]);

	JAK.DOM.addClass(legendListItem, "clr");

	legendListItemHref.appendChild(legendListItemColor);

	legendListItem.appendChild(legendListItemHref);

	if ( sector.active ) { JAK.DOM.addClass(legendListItem, "active"); }
	if ( sector.deactive ) { JAK.DOM.addClass(legendListItem, "deactive"); }

	JAK.Events.addListener(legendListItemHref, "click", this, "_legendClick");
	JAK.Events.addListener(legendListItem, "mouseover", this, "_legendOver");
	JAK.Events.addListener(legendListItem, "mouseout", this, "_legendOut");

	return legendListItem;
}

/**
 * pridani note do legendy
 * @param {object} sector - sector ke kteremu bude note prirazen
 * @param {integer} i - poradi note
 */
JAK.Chart.prototype._addNoteToLegend = function (sector, i) {
	var legendListItem = JAK.cel("li"),
		legendListItemHref = JAK.mel("a", {href: "#"}),
		legendListItemName = JAK.cel("span"),
		options = this.options;

	if ( sector.content ) { legendListItemHref.innerHTML = sector.content; }

	legendListItemName.innerHTML = sector.name;
	JAK.DOM.setStyle(legendListItemName, {
		display: "block",
		fontSize: options.noteFontSize,
		fontWeight: "bold"
	});

	var posX = sector.point[0],
		posY = this._c.bottom - sector.point[1] + options.padding,
		display = "block",
		textAlign = "left",
		className = "noteLabel";

	if ( posX >= this._c.graphWidth + this._c.left ||  posX <= this._c.left) {
		display = "none";
	}

	if ( sector.id && this._eventLabel[sector.id] ){
		var c = this._c,
			eventLabel = this._eventLabel[sector.id];
		textAlign = "center";

		if ( eventLabel.start == eventLabel.end ) {
			eventLabel.start -= 1;
			eventLabel.end += 1;
		}

		posX = eventLabel.start + ( eventLabel.end - eventLabel.start ) / 2;
		posY = c.graphHeight - options.noteLabel.top + c.top;

		if ( eventLabel.end >= c.left && eventLabel.start <= c.right ) {
			if ( posX < c.left ) {
				posX = c.left + 1;
			}
			else if ( posX > c.right ) {
				posX = c.right - 1;
			}

			display = "block";
		}

		className = "eventLabel";
	}

	var noteLabel = this.createLabel(posX, posY, sector.name, {blockEvents: true, className: className, display: display, textAlign: textAlign});

	legendListItem.setAttribute("id", "label-" + noteLabel);

	legendListItem.appendChild(legendListItemName);

	legendListItem.appendChild(legendListItemHref);

	JAK.Events.addListener(legendListItem, "click", this, "_noteClick");
	JAK.Events.addListener(legendListItem, "mouseover", this, "_noteOver");
	JAK.Events.addListener(legendListItem, "mouseout", this, "_noteOut");

	JAK.Events.addListener(JAK.gel(noteLabel), "click", this, "_noteClick");
	JAK.Events.addListener(JAK.gel(noteLabel), "mouseover", this, "_noteOver");
	JAK.Events.addListener(JAK.gel(noteLabel), "mouseout", this, "_noteOut");

	return legendListItem;
}

/**
 * vykresleni popisku pro udalost
 */
JAK.Chart.prototype._drawEventLabel = function () {
	var c = this._c,
	options = this.options;

	for ( i in this._eventLabel ) {
		var eventLabel = this._eventLabel[i],
			txt = "",
			left = 0,
			bottom = 0,
			display = "block",
			textAlign = "center";

		if ( eventLabel.start == eventLabel.end ) {
			eventLabel.start -= 1;
			eventLabel.end += 1;
		}

		this._b.drawPolygon([[eventLabel.start,c.bottom],[eventLabel.start, c.top],[eventLabel.end, c.top],[eventLabel.end, c.bottom]], {lineWidth: options.rows.width, strokeColor: options.rows.color, fillColor: (eventLabel.color) ? eventLabel.color : options.noteLabel.color, fillOpacity: 0.2},this._eventLabelGroup[1])
	}
}

/**
 * vytvoreni standartni animace
 * @param {object} animeSettings - nastaveni animace
 * @param {integer} groupindex - index skupiny, ktera se bude animovat
 */
JAK.Chart.prototype._createBasicAnimation = function (animeSettings, groupindex) {
	var basicAnime = null,
		settings = {
		animeAttribute: animeSettings.animeAttribute || "width",
		startWidth: animeSettings.startWidth || "0",
		startHeight: animeSettings.startHeight || "100%",
		maskLeft: animeSettings.maskLeft || this.options.padding,
		maskTop: animeSettings.maskTop || this.options.padding,
		startValue: animeSettings.startValue || 0,
		endValue: animeSettings.endValue || 0,
		valueUnit: animeSettings.valueUnit || "",
		animationLength: animeSettings.animationLength || this.options.onloadAnimationLength
	}

	if ( settings.animeAttribute == "style" ) {
		this._groups[groupindex][1].setAttribute(settings.animeAttribute,"opacity: 0");
	}
	else {
		var clip = this._b.createClip();
		clip[1].parentNode.insertBefore(clip[1], this._groups[groupindex][1]);

		var mask = this._b.drawRect(settings.maskLeft, settings.maskTop, settings.startWidth, settings.startHeight, {fillColor: "#000"}, clip[1]);

		this._groups[groupindex][1].setAttribute("clip-path","url(#" + clip[0] + ")");
	}

	basicAnime = new JAK.Interpolator([settings.startValue], [settings.endValue], settings.animationLength, null);
	basicAnime.maskElm = mask;
	basicAnime.unit = settings.valueUnit;
	basicAnime.animeAttribute = settings.animeAttribute;
	basicAnime.group = this._groups[groupindex][1];
	if ( settings.animeAttribute == "style" ) {
		basicAnime.callback = function(a) { this.group.setAttribute(this.animeAttribute, "opacity: " + (a[0] + this.unit)); }
	}
	else {
		basicAnime.callback = function(a) { if ( JAK.gel(this.maskElm) ) JAK.gel(this.maskElm).setAttribute(this.animeAttribute, +a[0] + this.unit); }
	}

	return basicAnime;
}

/**
 * pridani preview grafu (maly graf pod hlavnim grafem)
 */
JAK.Chart.prototype._addPreviewGraph = function () {
	var options = this.options,
		c = this._c;
	this._zoomableGroup[2] = this._previewGraph();

	if ( this._zoomableGroup[2][0] && this._zoomableGroup[2][1] ) {
		if ( !this._redrawing ) {
			var top = c.top,
				left = c.left,
				bottomGraph = c.bottom + options.previewGraph.paddingFromGraph,
				bottomPreview = c.bottom + options.previewGraph.paddingFromGraph + options.previewGraph.height + 13,
				right = c.right,
				maskLeft =  c.left - this._graphMove / ( 1 + this._zoomLevel / 10 );

			if ( maskLeft < c.left ) { maskLeft = c.left; }

			var maskRight = maskLeft + c.graphWidth / ( 1 + this._zoomLevel / 10 );

			this._zoomableMaskGroup[2] = this._b.drawRect(left, bottomGraph, right-left, bottomPreview - bottomGraph, {lineWidth:0, strokeColor:"none", fillColor: "#fff", fillOpacity: "0"}, this._zoomableGroup[1]);

			this._zoomableMaskGroup[0] = this._b.drawPolygon([[left, top],
															[left, bottomGraph],
															[maskLeft, bottomGraph],
															[maskLeft, bottomPreview],
															[maskRight, bottomPreview],
															[maskRight, bottomGraph],
															[right, bottomGraph],
															[right, top]], {lineWidth:1, strokeColor:"#666", fillColor: "none", fillOpacity: "0"}, this._zoomableGroup[1]);

			this._createScrollBar();

			this._zoomableMaskPreviewGroup = this._b.createClip();
			this._b._g.parentNode.insertBefore(this._zoomableMaskPreviewGroup[1], this._b._g);

			this._zoomableMaskGroup[1] = this._b.drawRect(maskLeft, c.top + c.graphHeight + this.options.previewGraph.paddingFromGraph, maskRight - maskLeft, this.options.previewGraph.height, {fillColor: "#000"}, this._zoomableMaskPreviewGroup[1]);
		}
		else {
			this._zoomableGroup[1].appendChild(JAK.gel(this._zoomableMaskGroup[2]));
			this._zoomableGroup[1].appendChild(JAK.gel(this._zoomableMaskGroup[0]));
		}

		this._zoomableGroup[1].childNodes[1].setAttribute("clip-path","url(#" + this._zoomableMaskPreviewGroup[0] + ")");
	}
}

/**
 * pridani masky na preview graf
 */
JAK.Chart.prototype._addZoomableMask = function () {
	var c = this._c,
		b  = this._b;

	if ( !this._redrawing ) {
		this._zoomableGroup = b.createGroup();
		this._zoomableMaskGroup = [];
		this._scrollBarGroup = [];
		this._zoomableMask = b.createClip();
		b._g.parentNode.insertBefore(this._zoomableMask[1], b._g);
	}
	else {
		if ( this._undefinedEvent && JAK.gel(this._zoomableGroup[2][0]) && JAK.gel(this._zoomableGroup[2][1]) ) {
			JAK.gel(this._zoomableGroup[2][0]).parentNode.removeChild(JAK.gel(this._zoomableGroup[2][0]));
			JAK.gel(this._zoomableGroup[2][1]).parentNode.removeChild(JAK.gel(this._zoomableGroup[2][1]));
		}
		b._g.appendChild(this._zoomableGroup[1]);
	}

	if ( !this._redrawing ) {
		var mask = b.drawRect(c.left, c.top, c.graphWidth, c.graphHeight + ( this.options.frame.width * 2 ) + 11 + 3, {fillColor: "#000"}, this._zoomableMask[1]);
	}

	this._textGroupX[1].setAttribute("clip-path","url(#" + this._zoomableMask[0] + ")");

	for ( var i = 0; i < this._groups.length; i++ ) {
		this._groups[i][1].setAttribute("clip-path","url(#" + this._zoomableMask[0] + ")");
	}

	this._gridGroup[1].setAttribute("clip-path","url(#" + this._zoomableMask[0] + ")");

	if ( this._eventLabelGroup ) { this._eventLabelGroup[1].setAttribute("clip-path","url(#" + this._zoomableMask[0] + ")"); }

	if ( !this._redrawing || ( this._redrawing && this._undefinedEvent ) ) {
		this._addPreviewGraph();
	}
}

/**
 * posun masky na preview grafu
 */
JAK.Chart.prototype._moveZoomableMaskPreview = function () {
	var c = this._c,
		left = c.left - this._graphMove / ( 1 + this._zoomLevel / 10 ),
		width = c.graphWidth / ( 1 + this._zoomLevel / 10 );

	if ( left < c.left ) { left = c.left; }

	JAK.gel(this._zoomableMaskGroup[1]).setAttribute("width", width );
	JAK.gel(this._zoomableMaskGroup[1]).setAttribute("x", left );

	this._scrollBarGroup[2][0].style.left = ( left - 8 / 2 ) + "px";
	this._scrollBarGroup[2][1].style.left = ( left + width - 8 / 2 ) + "px";

	this._moveZoomableFramePreview();
}

/**
 * posun vyrezu na preview grafu
 */
JAK.Chart.prototype._moveZoomableFramePreview = function () {
	var c = this._c,
		options = this.options;
		top = c.top,
		left = c.left,
		maskLeft =  c.left - this._graphMove / ( 1 + this._zoomLevel / 10 ),
		bottomGraph = c.bottom + options.previewGraph.paddingFromGraph,
		bottomPreview = c.bottom + options.previewGraph.paddingFromGraph + options.previewGraph.height + 13,
		right = c.right;

	if ( maskLeft < c.left ) { maskLeft = c.left; }

	var maskRight = maskLeft + c.graphWidth / ( 1 + this._zoomLevel / 10 );

	this._b._drawPoints(JAK.gel(this._zoomableMaskGroup[0]), [
		[left, top],
		[left, bottomGraph],
		[maskLeft, bottomGraph],
		[maskLeft, bottomPreview],
		[maskRight, bottomPreview],
		[maskRight, bottomGraph],
		[right, bottomGraph],
		[right, top]
	]);

	JAK.DOM.setStyle(this._scrollBarGroup[1],{
		left: maskLeft + "px",
		width: ( maskRight - maskLeft ) + "px",
	});
}

/**
 * vytvoreni scrollbaru pod preview grafem
 */
JAK.Chart.prototype._createScrollBar = function () {
	var c = this._c,
		options = this.options.previewGraph;
		maskLeft =  c.left - this._graphMove / ( 1 + this._zoomLevel / 10 ),
		right = c.right;

	if ( maskLeft < c.left ) { maskLeft = c.left; }

	var maskRight = maskLeft + c.graphWidth / ( 1 + this._zoomLevel / 10 );

	var scrollBg = JAK.mel("div", {className: "scrollBg"});
	JAK.DOM.setStyle(scrollBg, {
		backgroundImage: "url(" + options.scrollImgDir + "scroll-bar-bg.png)",
		backgroundPosition: "0 0",
		backgroundRepeat: "repeat-x",
		position: "absolute",
		top: c.bottom + options.paddingFromGraph + options.height + "px",
		left: c.left + "px",
		width: c.graphWidth + "px",
		height: "13px"
	});

	var scrollArrowL = JAK.mel("div", {className: "scrollArrowL"});
	JAK.DOM.setStyle(scrollArrowL, {
		backgroundImage: "url(" + options.scrollImgDir + "scroll-bar-arrow-left.png)",
		backgroundPosition: "0 0",
		backgroundRepeat: "no-repeat",
		position: "absolute",
		top: "0px",
		left: "0px",
		width: "16px",
		height: "13px"
	});
	scrollBg.appendChild(scrollArrowL);

	var scrollArrowR = JAK.mel("div", {className: "scrollArrowR"});
	JAK.DOM.setStyle(scrollArrowR, {
		backgroundImage: "url(" + options.scrollImgDir + "scroll-bar-arrow-right.png)",
		backgroundPosition: "0 0",
		backgroundRepeat: "no-repeat",
		position: "absolute",
		top: "0px",
		left: ( c.graphWidth - 16 ) + "px",
		width: "16px",
		height: "13px"
	});
	scrollBg.appendChild(scrollArrowR);

	var scrollButtonL = JAK.mel("div", {className: "scrollButtonLeft"});
	JAK.DOM.setStyle(scrollButtonL, {
		backgroundImage: "url(" + options.scrollImgDir + "scroll-button.png)",
		backgroundPosition: "center 0",
		backgroundRepeat: "no-repeat",
		position: "absolute",
		top: c.bottom + options.paddingFromGraph + options.height / 2 + "px",
		left: maskLeft - 8 / 2 + "px",
		width: "8px",
		height: "13px",
		zIndex: 120
	});
	var id = JAK.idGenerator();
	scrollButtonL.setAttribute('id', id);

	this._setEventsForScrollButton(scrollButtonL);

	var scrollButtonR = JAK.mel("div", {className: "scrollButtonRight"});
	JAK.DOM.setStyle(scrollButtonR, {
		backgroundImage: "url(" + options.scrollImgDir + "scroll-button.png)",
		backgroundPosition: "center 0",
		backgroundRepeat: "no-repeat",
		position: "absolute",
		top: c.bottom + options.paddingFromGraph + options.height / 2 + "px",
		left: maskRight - 8 / 2 + "px",
		width: "8px",
		height: "13px",
		zIndex: 120
	});
	id = JAK.idGenerator();
	scrollButtonR.setAttribute('id', id);

	this._setEventsForScrollButton(scrollButtonR);

	var scrollBar = JAK.mel("div", {className: "scrollBar"});
	JAK.DOM.setStyle(scrollBar, {
		backgroundImage: "url(" + options.scrollImgDir + "scroll-bar.png)",
		backgroundPosition: "center 0",
		backgroundRepeat: "no-repeat",
		position: "absolute",
		top: c.bottom + options.paddingFromGraph + options.height + "px",
		left: maskLeft + "px",
		width: ( maskRight - maskLeft ) + "px",
		height: "13px"
	});

	id = JAK.idGenerator();
	scrollBar.setAttribute('id', id);

	this._setEventsForScrollButton(scrollBar);

	this._parentElm.appendChild(scrollBg);
	this._parentElm.appendChild(scrollBar);
	this._parentElm.appendChild(scrollButtonL);
	this._parentElm.appendChild(scrollButtonR);

	this._scrollBarGroup.push(scrollBg);
	this._scrollBarGroup.push(scrollBar);
	this._scrollBarGroup.push([scrollButtonL, scrollButtonR]);
}

/**
 * nastaveni posluchacu na buttonech na scroll baru
 * @param {element} elm - element kteremu se nastavi posluchace na udalosti
 */
JAK.Chart.prototype._setEventsForScrollButton = function (elm) {
	JAK.Events.addListener(elm, "mouseover", this, "_scrollButtonOver");
	JAK.Events.addListener(elm, "mouseout", this, "_scrollButtonOut");
	JAK.Events.addListener(elm, "mousedown", this, "_scrollButtonDown");
	JAK.Events.addListener(elm, "mouseup", this, "_scrollButtonUp");
	JAK.Events.addListener(elm, "mousemove", this, "_scrollButtonMove");
}

/**
 * zmena sirky vysece na preview grafu
 * @param {boolean} toLeft - priznak o smeru zvetseni vysece
 */
JAK.Chart.prototype._changePreviewWidth = function (toLeft) {
	var c = this._c,
		options = this.options.previewGraph,
		mask = JAK.gel(this._zoomableMaskGroup[1]),
		scrollBar = JAK.gel(this._scrollBarGroup[1]),
		mousePixelMove = Math.round(this._lastMouseMove.clientX - this._mouseDownCoords.clientX),
		scrollBarWidth = parseInt(scrollBar.style.width) + ( mousePixelMove * ( ( toLeft ) ? -1 : 1 ) ),
		leftOrig = parseInt(scrollBar.style.left) + ( ( toLeft ) ? mousePixelMove : 0 ),
		top = c.top,
		left = c.left,
		bottomGraph = c.bottom + options.paddingFromGraph,
		bottomPreview = c.bottom + options.paddingFromGraph + options.height + 13,
		right = c.right;

	if ( scrollBarWidth < 10 ) { scrollBarWidth = 10; }
	if ( leftOrig < c.left ) {
		scrollBarWidth = parseInt(scrollBar.style.width);
		leftOrig = c.left;
	}
	if ( leftOrig + scrollBarWidth > c.right ) { scrollBarWidth = c.right - leftOrig; }
	if ( leftOrig + 10 > c.right ) { leftOrig = c.right - 10; }

	scrollBar.style.width = scrollBarWidth + "px";
	scrollBar.style.left = leftOrig + "px";

	this._scrollBarGroup[2][0].style.left = ( leftOrig - 8 / 2 ) + "px";
	this._scrollBarGroup[2][1].style.left = ( leftOrig + scrollBarWidth - 8 / 2 ) + "px";

	if ( leftOrig < c.left ) { leftOrig = c.left; }

	var maskRight = leftOrig + scrollBarWidth;

	this._b._drawPoints(JAK.gel(this._zoomableMaskGroup[0]), [
		[left, top],
		[left, bottomGraph],
		[leftOrig, bottomGraph],
		[leftOrig, bottomPreview],
		[maskRight, bottomPreview],
		[maskRight, bottomGraph],
		[right, bottomGraph],
		[right, top]
	]);

	this._zoomLevel = c.graphWidth / ( maskRight - leftOrig ) * 10 - 10;

	this._graphMove = ( leftOrig - left ) * (1 + this._zoomLevel / 10) * -1;
}

/**
 * Vytvoreni dat pro element path
 * @param {array} datapoints - pole se souradnicema
 * @param {int} first - souradnice kterou element bude zacinat
 * @param {int} last - souradnice kterou element bude koncit
 * @param {boolean} fill - priznak zda se jedna o element s vyplni
 */
JAK.Chart.prototype._createPathData = function(datapoints, first, last, fill) {
	var path = [],
		start = 0,
		bottom = this._computed.bottom,
		datapointLength = datapoints.length;

	if ( first ) {
		path.push(['M', first,bottom]);
	}
	else {
		start = 1;
		if ( datapoints[0][1] != null ) {
			path.push(['M', datapoints[0][0], datapoints[0][1]]);
		}
		else {
			while ( datapoints[start] && datapoints[start][1] == null ) {
				start++;
			}
			if ( datapoints[start] ) {
				path.push(['M', datapoints[start][0], datapoints[start][1]]);
				start++;
			}
		}

	}
	if ( datapoints[start] ) {
		for ( var x = start; x < datapointLength; x++ ) {
			if ( fill ) {
				if ( datapoints[x][1] === null ) {
					if ( datapoints[x-1] ) { path.push(['L', datapoints[x-1][0], bottom]); }
					if ( datapoints[x+1] ) { path.push(['L', datapoints[x+1][0], bottom]); }
				}
				else { path.push(['L', datapoints[x][0], datapoints[x][1]]); }
			}
			else {
				if ( datapoints[x-1] && datapoints[x-1][1] === null && datapoints[x][1] !== null ) {
					path.push(['M', datapoints[x][0], datapoints[x][1]]);
				}
				else if ( datapoints[x][1] !== null ) {
					path.push(['L', datapoints[x][0], datapoints[x][1]]);
				}
			}
		}
		if ( first ) {
			path.push(['L', last,bottom]);
			path.push(['L', first,bottom]);
		}

		if ( last ) {
			path.push(['M', last, bottom]);
	}
	}

	return path;
}

/**
 * vrati rodicovsky element
 */
JAK.Chart.prototype.getContainer = function() {
	return this._backend.getContainer();
}

/**
 * vytvori label
 * @param {integer} xT - pozice na ose X
 * @param {integer} yT - pozice na ose Y
 * @param {string} txt - obsah labelu
 * @param {object} options - nastaveni labelu
 */
JAK.Chart.prototype.createLabel = function(xT, yT, txt, options) {
	var label = JAK.cel("div");
	label.innerHTML = txt;

	var showLabel = this.options.showLabel,
		textAlign = options.textAlign || "left",
		display = options.display || "block",
		blockEvents = options.blockEvents || false,
		className = options.className || null,

		reduceHeight = ( this.options.zoomable ) ?  ( this.options.previewGraph.height + this.options.previewGraph.paddingFromGraph ) : 0;

	JAK.DOM.setStyle(label, {
		position: "absolute",
		bottom: ( yT + this.options.labelPosition.displacementY + this.legend.reduceLabelFromTop + reduceHeight ) +"px",
		left: ( textAlign == "left" || textAlign == "center" )? ( ( xT + this.options.labelPosition.displacementX ) +"px" ) : "auto",
		right: ( textAlign == "right" )? ( ( xT + this.options.labelPosition.displacementX /*+ this.legend.reduceLabelFromLeft*/ ) +"px" ) : "auto",
		display: display,
		zIndex: 120
	});

	var arrow = JAK.cel("span");
	label.appendChild(arrow);

	var id = JAK.idGenerator();
	label.setAttribute('id', id);

	JAK.DOM.addClass(label, "graphLabel " + textAlign + (( className ) ? " " + className : ""));

	if ( showLabel == "mouseover" && !blockEvents ) {
		JAK.Events.addListener(label,"mouseover", this, "_showElm");
		JAK.Events.addListener(label,"mouseout", this, "_hideElm");
	}

	if ( showLabel == "click" && !blockEvents ) {
		JAK.Events.addListener(label,"click", this, "_hideElm");
	}

	this._parentElm.appendChild(label);

	if ( textAlign == "center" ) {
		label.style.left = ( parseFloat(label.style.left) - label.offsetWidth / 2 - this.options.labelPosition.displacementX ) + "px";
		arrow.style.left = ( label.offsetWidth / 2 - arrow.offsetWidth / 2 ) + "px";
	}

	return id;
}

/**
 * Pridani caroveho grafu
 * @param {object} data
 * @param {object} options
 */
JAK.Chart.prototype.addLineChart = function (data, options) {
	this._secondOptions = [];
	var secondOptions = this._secondOptions;

	if ( !this.includeGraph ) { this.includeGraph = []; }
	secondOptions.push({});

	this.options.active = false;

	this._mergeOptions(secondOptions[secondOptions.length-1], JSON.parse(JSON.stringify(this.options)));
	this._mergeOptions(secondOptions[secondOptions.length-1], options);

	this.includeGraph.push(new JAK.Chart.Line(this._parentElm, data, secondOptions[secondOptions.length-1], this));
}

/**
 * pridani sloupcoveho grafu
 * @param {object} data
 * @param {object} options
 */
JAK.Chart.prototype.addBarChart = function (data, options) {
	this._secondOptions = [];
	var secondOptions = this._secondOptions

	if ( !this.includeGraph ) { this.includeGraph = []; }
	secondOptions.push({});

	this.options.active = false;

	this._mergeOptions(secondOptions[secondOptions.length-1], JSON.parse(JSON.stringify(this.options)));
	this._mergeOptions(secondOptions[secondOptions.length-1], options);

	this.includeGraph.push(new JAK.Chart.Bar(this._parentElm, data, secondOptions[secondOptions.length-1], this));
}

/**
 * nastaveni priznaku pro zobrazeni skupiny v grafu
 * @param {integer} index - index skupiny
 */
JAK.Chart.prototype.showItem = function(index) {
	this.origItems[index].deactive = false;

	this._zoom();
}

/**
 * nastaveni priznaku pro skryti skupiny v grafu
 * @param {integer} index - index skupiny
 */
JAK.Chart.prototype.hideItem = function(index) {
	this.origItems[index].deactive = true;

	this._zoom();
}

/**
 * formatovani cisla
 * @param {integer} num - cislo pro formatovani
 * @param {boolean} deciNum - priznak zda maji byt zobrazena desetinna mista
 */
JAK.Chart.prototype.formatNumber = function (num, deciNum) {
	nStr = num.toString();
	var x = nStr.split('.');
	var x1 = x[0];
	var x2 = deciNum ? (( x.length > 1 ) ? ',' + String(x[1]).substr(0,2) : ',00') : ""; // nahradime tecku carkou
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ' ' + '$2'); // nahradime mezerou cesky format 1 000,00
	}
	return x1 + x2;
}

/**
 * zaokrouhleni na urcity pocet mist
 * @param {integer} num - cislo
 * @param {integer} dec - urcuje pocet na kolik mist bude zaokrouhleno (v desitkove soustave [10,1000,...])
 */
JAK.Chart.prototype.mRound = function (num, dec) {
	return Math.round(parseFloat(num) * dec) / dec;
}

/**
 * prevod cisla na string s pridanim zkratky (1.5 mil., 4.85 mld.,...)
 * @param {integer} num - cislo
 */
JAK.Chart.prototype.numToString = function (num) {
	var fNum = this.formatNumber(num);

	var numArr = fNum.split(" ");

	if ( numArr.length > 1 ) {
		if ( parseFloat(numArr[1]) ) {
			var dec = this.mRound( parseFloat(numArr[1]) / 1000, 100 );
		}

		fNum = ( parseFloat(numArr[0]) + ( dec ? dec : 0 ) ).toString().replace(".",",");

		switch ( numArr.length ) {
			case 2:
				fNum += " tis.";
			break;
			case 3:
				fNum += " mil.";
			break;
			case 4:
				fNum += " mld.";
			break;
		}
	}

	return fNum;
}

/**
 * upraveni methody _call na interpolatoru pro pocitani s vice nez jednou hodnotou
 */
JAK.Interpolator.prototype._call = function(frac) {
	var newTempValue = [];
	var valLength = this.startVal.length;
	for ( var i = 0; i < valLength; i++ ) {
		var result = this._interpolate(frac);
		var delta = this.endVal[i] - this.startVal[i];
		newTempValue[i] = this.startVal[i] + delta*result;
	}
	this.callback(newTempValue);
}