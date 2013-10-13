
JAS.NewCore = JAK.ClassMaker.makeSingleton({
	NAME: "NewCore",
	VERSION: "4.0",
	EXTEND: JAS.CoreBase
});

JAS.NewCore.ATTR_ACTION = "data-action";

JAS.NewCore.ATTR_PARAMS = "data-params";

JAS.NewCore.ATTR_STOP_EVENT = "data-stop-event";

JAS.NewCore.DEFAULT_EVENT = "click";

/**
 * Rozparzuje query string
 *
 * @param  {string} qs
 * @return {object}
 */
JAS.NewCore.parseQs = function(qs) {
	if (!qs) {
		return {};
	}
	var items = qs.split("&");
	var params = {};
	var param, key, value;
	param = key = value = null;

	for (var i = 0, len = items.length; i < len; i++) {
		param = items[i].split("=");
		key = decodeURIComponent(param.shift());
		value = decodeURIComponent(param.join("="));
		var keyParsed = key.match(/(.*)\[([a-z0-9_]*)?\]$/i);
		if (keyParsed) {
			key = keyParsed[1];
			if (keyParsed[2]) { // jde o asociativni pole?
				if (!(params[key] instanceof Object)) { // prvni setkani s promennou, vytvorim objekt
					params[key] = {};
				}
				params[key][keyParsed[2]] = value;
			} else {
				if (!(params[key] instanceof Array)) { // prvni setkani s promennou, vytvorim pole
					params[key] = [];
				}
				params[key].push(value);
			}
		} else {
			params[key] = value;
		}
	}
	return params;
};

/**
 * Ze specifikovaneho objektu vytvori query string
 *
 * @param  {object} obj
 * @return {string}
 */
JAS.NewCore.makeQs = function(obj) {
	if (!obj || typeof(obj) != "object" || obj instanceof Array) {
		throw new Error("Invalid argument: argument must be object");
	}

	function handleValue(value) {
		if (value === null) {
			return "";
		} else if (typeof(value) == "boolean") {
			return "=" + (value ? "1" : "0");
		} else if (typeof(value) == "object") {
			throw new Error("Invalid argument: nested object");
		} else {
			return "=" + encodeURIComponent(value);
		}
	}
	var params = [];

	for (var p in obj) {
		if (typeof(obj[p]) == "object") {
			var s = "";
			var nf = false;
			if (obj[p] instanceof Array) {
				for (var i = 0, len = obj[p].length; i < len; i++) {
					if (nf) {
						s += "&";
					}
					s += encodeURIComponent(p) + "[]" + handleValue(obj[p][i]);
					nf = true;
				}
			} else {
				for (var key in obj[p]) {
					if (nf) {
						s += "&";
					}
					s += encodeURIComponent(p) + "[" + encodeURIComponent(key) + "]" + handleValue(obj[p][key]);
					nf = true;
				}
			}
			params.push(s);
		} else {
			params.push(encodeURIComponent(p) + handleValue(obj[p]));
		}
	}
	return params.join("&");
};

JAS.NewCore.formToQs = function(form) {
	var q = [];
	for (var i = 0, len = form.elements.length; i < len; i++) {
		var elm = form.elements[i];

		if (!elm.disabled && elm.name != "") {
			switch (elm.type) {
				case "checkbox":
				case "radio":
					if (elm.checked) {
						q.push(encodeURIComponent(elm.name) + "=" + encodeURIComponent(elm.value));
					}
					break;
				case "hidden":
				case "textarea":
				case "text":
				case "password":
				case "button":
				case "submit":
				case "select-one":
					q.push(encodeURIComponent(elm.name) + "=" + encodeURIComponent(elm.value));
					break;
				case "select-multiple":
					for (var j=0; j<elm.options.length; j++) {
						var option = elm.options[j];
						if (option.selected) {
							q.push(encodeURIComponent(elm.name) + "=" + encodeURIComponent(option.value));
						}
					}
					break;
				default:
					break;
			}
		}
	}
	return q.join("&");
};

/**
 * Slouci dva objekty do jednoho
 *
 * @param  {object} obj1
 * @param  {object} obj2
 * @param  {boolean} recursive
 * @return {object}
 */
JAS.NewCore.mergeObjects = function(obj1, obj2, recursive) {
	if (typeof(obj1) != "object" || obj1 === null || obj1 instanceof Array) {
		throw new Error("Invalid argument: first argument is not a object");
	}
	if (typeof(obj2) != "object" || obj2 === null || obj2 instanceof Array) {
		throw new Error("Invalid argument: second argument is not a object");
	}

	var newObj = {};
	for (var p in obj1) {
		newObj[p] = obj1[p];
	}
	for (var p in obj2) {
		if (recursive
		    && newObj[p]
		    && (typeof(newObj[p]) == "object" && !(newObj[p] instanceof Array))
		    && (typeof(obj2[p]) == "object") && !(obj2[p] instanceof Array)) {
			newObj[p] = JAS.NewCore.mergeObjects(newObj[p], obj2[p]);
		} else {
			newObj[p] = obj2[p];
		}
	}
	return newObj;
};

/**
 * Inicializace
 */
JAS.NewCore.prototype.$constructor = function() {
	this.$super();

	this._elms = [];
	this._store = [];

	JAK.Events.onDomReady(this, "_domReady");
};

/**
 * Zjisti relevantni prvky v prislusnem DOM uzlu a prida na ne patricne posluchace
 *
 * @param {object} rootElm DOM uzel na ktery chceme navesit posluchace Jadra
 * @returns {number} pocet navesenych udalosti
 */
JAS.NewCore.prototype.addActions = function(rootElm) {
	if (!rootElm) {
		throw new Error("Argument rootElm must be specified, otherwise can not add listeners");
	}
	var foundElms = rootElm.querySelectorAll("[" + JAS.NewCore.ATTR_ACTION + "]");

	for (var i = 0, len = foundElms.length; i < len; i++) {
		if (this._storeContains(foundElms[i])) {
			this._storeRemove(foundElms[i]);
		}

		this._storeAdd(
			foundElms[i],
			JAK.Events.addListener(foundElms[i], this._getActionEvent(foundElms[i].getAttribute(JAS.NewCore.ATTR_ACTION)), this, "_processEvent")
		);
	}

	this._log("Number of added CoreActions: " + i);
	return i;
};

/**
 * Zjisti relevantni prvky v prislusnem DOM uzlu a aktualizuje na nich patricne posluchace
 *
 * @param {object} rootElm DOM uzel na kterem chceme aktualizovat posluchace Jadra
 * @returns {number} pocet navesenych udalosti
 */
JAS.NewCore.prototype.updateActions = function(rootElm) {
	return this.addActions(rootElm);
};

/**
 * Zjisti relevantni prvky v prislusnem DOM uzlu a odebere z nich patricne posluchace
 *
 * @param {object} rootElm DOM uzel ze ktereho chceme odvesit posluchace Jadra
 * @returns {number} pocet odvesenych udalosti
 */
JAS.NewCore.prototype.removeActions = function(rootElm) {
	if (!rootElm) {
		throw new Error("Argument rootElm must be specified, otherwise can not remove listeners");
	}
	var foundElms = rootElm.querySelectorAll("[" + JAS.NewCore.ATTR_ACTION + "]");

	var realRemoved = 0;
	for (var i = 0, len = foundElms.length; i < len; i++) {
		if (this._storeRemove(foundElms[i])) {
			realRemoved++;
		}
	}

	this._log("Number of removed CoreActions: " + realRemoved);
	return realRemoved;
};

JAS.NewCore.prototype._storeContains = function(elm) {
	return this._elms.indexOf(elm) > -1;
};

JAS.NewCore.prototype._storeAdd = function(elm, listenerId) {
	this._elms.push(elm);
	this._store.push({
		elm: elm,
		listener: listenerId
	})
};

JAS.NewCore.prototype._storeRemove = function(elm) {
	for (var i = 0, len = this._store.length; i < len; i++) {
		if (this._store[i].elm == elm) {
			JAK.Events.removeListener(this._store[i].listener);
			this._elms.splice(this._elms.indexOf(elm), 1);
			this._store.splice(i, 1);
			return true;
		}
	}
	return false;
};

JAS.NewCore.prototype._domReady = function() {
	this.addActions(document.body);
};

JAS.NewCore.prototype._getActionEvent = function(actionSubject) {
	var aEvent = actionSubject.split(":")[0];
	return aEvent || JAS.NewCore.DEFAULT_EVENT;
};

JAS.NewCore.prototype._getActionStateId = function(actionSubject) {
	var aStateId = actionSubject.split(":");
	return aStateId[1] || "";
};

JAS.NewCore.prototype._processEvent = function(e, elm) {
	if (e.type == "click" && (
	    	e.button == JAK.Browser.mouse.middle /* v IE8 ma button vzdy 0 */ || e.ctrlKey || e.shiftKey || e.metaKey)) {
		// v techto pripadech chceme, aby se o udalost postaral prohlizec, ne Jadro
		return;
	}

	if (elm.hasAttribute(JAS.NewCore.ATTR_STOP_EVENT)) {
		JAK.Events.stopEvent(e);
	}
	JAK.Events.cancelDef(e);

	if (elm.tagName.toLowerCase() == "form") {
		var faqTmp = elm.getAttribute("action").split("?");
		var formPath = faqTmp.shift();
		var formActionQs = faqTmp.join("?");
		var formDataQs = JAS.NewCore.formToQs(elm);

		if (formActionQs) {
			var formCompleteQs = JAS.NewCore.makeQs(JAS.NewCore.mergeObjects(JAS.NewCore.parseQs(formActionQs), JAS.NewCore.parseQs(formDataQs)));
		} else {
			var formCompleteQs = formDataQs;
		}
		var url = formPath  + "?" + formCompleteQs;

	} else {
		var url = elm.getAttribute("href");
	}

	var elmParams = this._parseElmParams(elm.getAttribute(JAS.NewCore.ATTR_PARAMS));
	if (url) {
		var stateAndParams = this._getResponsibleState(url);
		var stateId = stateAndParams.stateId;
		var params = JAS.NewCore.mergeObjects(stateAndParams.params, elmParams);

	} else {
		var stateId = this._getActionStateId(elm.getAttribute(JAS.NewCore.ATTR_ACTION));
		var params = elmParams;
	}

	if (stateId) {
		this.go(stateId, params);
	} else {
		console.error("There isn't any state ID in attribute data-action, or any URL! It isn't possible possible change state");
	}
};

JAS.NewCore.prototype._parseElmParams = function(paramsSubject) {
	if (!paramsSubject) {
		return {};
	}

	try {
		return JSON.parse(paramsSubject);
	} catch(err) {
		console.error(err);
		return "";
	}
};
