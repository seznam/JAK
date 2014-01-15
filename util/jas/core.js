
/**
 * @overview Navesuje a odvesuje udalosti na prvky slouzici k obsluze aplikace
 * @author Jose
 *
 * Terminologie:
 * 		CoreActions - udalosti definovane v atributu data-action
 */

/**
 * @class Realizuje neveseni a odveseni udalosti na aktivni prvky majici atribut "data-action"
 * @group jas
 */
JAS.Core = JAK.ClassMaker.makeSingleton({
	NAME: "Core",
	VERSION: "4.1",
	EXTEND: JAS.CoreBase
});

JAS.Core.ATTR_ACTION = "data-action";

JAS.Core.ATTR_PARAMS = "data-params";

JAS.Core.ATTR_STOP_EVENT = "data-stop-event";

JAS.Core.DEFAULT_EVENT = "click";

/**
 * Rozparzuje query string
 *
 * @param   {string} qs
 * @returns {object}
 */
JAS.Core.parseQs = function(qs) {
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
 * @param   {object} obj
 * @returns {string}
 */
JAS.Core.makeQs = function(obj) {
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
		if (obj[p] && typeof(obj[p]) == "object") {
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

/**
 * Serializuje data z formulare do query stringu
 *
 * @param   {object} form element formulare
 * @returns {string}      query string reprezentujici stav formulare
 */
JAS.Core.formToQs = function(form) {
	var q = [];
	for (var i = 0, len = form.elements.length; i < len; i++) {
		var elm = form.elements[i];

		if (!elm.disabled && elm.name != "") {
			switch (elm.type) {
				case "reset":
				case "button":
					break;
				case "select-one":
					q.push(encodeURIComponent(elm.name) + "=" + encodeURIComponent(elm.value));
					break;
				case "select-multiple":
					for (var j = 0; j < elm.options.length; j++) {
						var option = elm.options[j];
						if (option.selected) {
							q.push(encodeURIComponent(elm.name) + "=" + encodeURIComponent(option.value));
						}
					}
					break;
				case "checkbox":
				case "radio":
					if (!elm.checked) {
						break;
					}
					// pokud je checked, provede se vetev default
				default:
					q.push(encodeURIComponent(elm.name) + "=" + encodeURIComponent(elm.value));
			}
		}
	}
	return q.join("&");
};

/**
 * Slouci dva objekty do jednoho
 *
 * @param   {object}  obj1
 * @param   {object}  obj2
 * @param   {boolean} [recursive]
 * @returns {object}
 */
JAS.Core.mergeObjects = function(obj1, obj2, recursive) {
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
			newObj[p] = JAS.Core.mergeObjects(newObj[p], obj2[p]);
		} else {
			newObj[p] = obj2[p];
		}
	}
	return newObj;
};

JAS.Core.prototype.$constructor = function() {
	this.$super();

	this._elms = [];
	this._store = [];
};

/**
 * @see JAS.CoreBase#init
 */
JAS.Core.prototype.init = function(options) {
	this.$super(options);

	JAK.Events.onDomReady(this, "_domReady");
};

/**
 * Zjisti relevantni prvky v prislusnem DOM uzlu a prida na ne patricne posluchace
 *
 * @param   {object} rootElm DOM uzel na ktery chceme navesit posluchace Jadra
 * @returns {number}         pocet navesenych udalosti
 */
JAS.Core.prototype.addActions = function(rootElm) {
	if (!rootElm) {
		throw new Error("Argument rootElm must be specified, otherwise can not add listeners");
	}
	var foundElms = rootElm.querySelectorAll("[" + JAS.Core.ATTR_ACTION + "]");

	for (var i = 0, len = foundElms.length; i < len; i++) {
		if (this._storeContains(foundElms[i])) {
			this._storeRemove(foundElms[i]);
		}

		this._storeAdd(
			foundElms[i],
			JAK.Events.addListener(foundElms[i], this._getActionEvent(foundElms[i].getAttribute(JAS.Core.ATTR_ACTION)), this, "_processEvent")
		);
	}

	this._log("Number of added CoreActions: " + i);
	return i;
};

/**
 * Zjisti relevantni prvky v prislusnem DOM uzlu a aktualizuje na nich patricne posluchace
 *
 * @param   {object} rootElm DOM uzel na kterem chceme aktualizovat posluchace Jadra
 * @returns {number}         pocet navesenych udalosti
 */
JAS.Core.prototype.updateActions = function(rootElm) {
	return this.addActions(rootElm);
};

/**
 * Zjisti relevantni prvky v prislusnem DOM uzlu a odebere z nich patricne posluchace
 *
 * @param   {object} rootElm DOM uzel ze ktereho chceme odvesit posluchace Jadra
 * @returns {number}         pocet odvesenych udalosti
 */
JAS.Core.prototype.removeActions = function(rootElm) {
	if (!rootElm) {
		throw new Error("Argument rootElm must be specified, otherwise can not remove listeners");
	}
	var foundElms = rootElm.querySelectorAll("[" + JAS.Core.ATTR_ACTION + "]");

	var realRemoved = 0;
	for (var i = 0, len = foundElms.length; i < len; i++) {
		if (this._storeRemove(foundElms[i])) {
			realRemoved++;
		}
	}

	this._log("Number of removed CoreActions: " + realRemoved);
	return realRemoved;
};

/**
 * Rozsireni metody ze zakladniho Jadra
 *
 * Spusti prepnuti kontroleru dle specifikovaneho stavu a parametru nebo elementu
 *
 * @param   {any}     source      ID stavu, nebo element, z nehoz si ID a parametry stavu ziskam
 * @param   {object}  [params]    parametry jako "asociativni pole" (pokud je parametr source element, tak nic)
 * @param   {boolean} [updateUrl] zda zmenu stavu propisovat do URL, defaultne true
 * @throws  {Error}
 */
JAS.Core.prototype.go = function(source, params, updateUrl) {
	var stateId = "";
	if (typeof(source) == "string") {
		stateId = source;
	} else {
		var tmp = this._getStateIdAndParams(source);
		stateId = tmp.stateId;
		params = params ? JAS.Core.mergeObjects(tmp.params, params) : tmp.params;
	}

	this.$super(stateId, params, updateUrl);
};

/**
 * Zda je v ulozisti speicifikovany element
 *
 * @param   {object}  elm
 * @returns {boolean}
 */
JAS.Core.prototype._storeContains = function(elm) {
	return this._elms.indexOf(elm) > -1;
};

/**
 * Prida do uloziste specifikovany element a ID posluchace pro tento element
 *
 * @param   {object} elm
 * @param   {string} listenerId
 */
JAS.Core.prototype._storeAdd = function(elm, listenerId) {
	this._elms.push(elm);
	this._store.push({
		elm: elm,
		listener: listenerId
	})
};

/**
 * Odstrani z uloziste specifikovany element (a vsechny pridruzene atributy)
 *
 * @param   {object}  elm
 * @returns {boolean}     zda speicifikovany element v ulozisti skutecne byl
 */
JAS.Core.prototype._storeRemove = function(elm) {
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

/**
 * Akce, jez se maji provest, kdyz je DOM ready
 */
JAS.Core.prototype._domReady = function() {
	this.addActions(document.body);
};

/**
 * Ze subjektu akce vyparsuje typ, respektive skupinu typu, udalosti
 *
 * @param   {string} actionSubject subjekt akce (hodnota atributu data-action)
 * @returns {string}               typ udalosti, nebo defaultni udalost viz. JAS.Core.DEFAULT_EVENT
 */
JAS.Core.prototype._getActionEvent = function(actionSubject) {
	var aEvent = actionSubject.split(":")[0];
	return aEvent || JAS.Core.DEFAULT_EVENT;
};

/**
 * Ze subjektu akce vyparsuje ID stavu
 * @param   {string} actionSubject subjekt akce (hodnota atributu data-action)
 * @returns {string}               ID stavu, nebo prazdny retezec
 */
JAS.Core.prototype._getActionStateId = function(actionSubject) {
	var aStateId = actionSubject.split(":");
	return aStateId[1] || "";
};

/**
 * Ziska ID a parametry pozadovaneho stavu a spusti prepnuti stavu, a to bud:
 * 1) ziskanim URL adresy a nalezenim odpovidajiho statu dle vracenych parametru stavu a jejich pripadnym zmergovanim s parametry specifikovanymi patricnym atributem
 * 2) ziskanim ID stavu z patricneho atributu a parametru stavu z patricneho atributu
 *
 * @param   {object} e   object udalosti
 * @param   {object} elm odpovidajici element
 */
JAS.Core.prototype._processEvent = function(e, elm) {
	if (e.type == "click" && (
	    	e.button == JAK.Browser.mouse.middle /* v IE8 ma button vzdy 0 */ || e.ctrlKey || e.shiftKey || e.metaKey)) {
		// v techto pripadech chceme, aby se o udalost postaral prohlizec, ne Jadro
		return;
	}

	if (elm.hasAttribute(JAS.Core.ATTR_STOP_EVENT)) {
		JAK.Events.stopEvent(e);
	}
	JAK.Events.cancelDef(e);

	var data = this._getStateIdAndParams(elm);

	if (data.stateId) {
		this.go(data.stateId, data.params);
	} else {
		console.error("There isn't any state ID in attribute " + JAS.Core.ATTR_ACTION + ", or any URL! It isn't possible change state");
	}
};

/**
 * Ziska data potrebene pro predani metode JAS.CoreBase#go
 * 
 * @param   {object} elm element z nehoz ziskam stateId a parametry stavu
 * @returns {object}     objekt s atributy stateId a params
 */
JAS.Core.prototype._getStateIdAndParams = function(elm) {
	if (elm.tagName.toLowerCase() == "form") {
		var faqTmp = elm.getAttribute("action").split("?");
		var formPath = faqTmp.shift();
		var formActionQs = faqTmp.join("?");
		var formDataQs = JAS.Core.formToQs(elm);

		if (formActionQs) {
			var formCompleteQs = JAS.Core.makeQs(JAS.Core.mergeObjects(JAS.Core.parseQs(formActionQs), JAS.Core.parseQs(formDataQs)));
		} else {
			var formCompleteQs = formDataQs;
		}
		var url = formPath  + "?" + formCompleteQs;

	} else {
		var url = elm.getAttribute("href");
	}

	var elmParams = this._parseElmParams(elm.getAttribute(JAS.Core.ATTR_PARAMS));
	if (url) {
		var stateData = JAS.dispatcher.getStateData(url);
		var stateId = stateData.stateId;
		var params = JAS.Core.mergeObjects(stateData.params, elmParams);

	} else {
		var stateId = this._getActionStateId(elm.getAttribute(JAS.Core.ATTR_ACTION));
		var params = elmParams;
	}

	return { stateId:stateId, params:params };
};

/**
 * Rozparsuje hodnotu atributu, specifikujici parametry stavu
 * 
 * @param   {string} paramsSubject JSON
 * @returns {object}
 */
JAS.Core.prototype._parseElmParams = function(paramsSubject) {
	if (!paramsSubject) {
		return {};
	}

	try {
		return JSON.parse(paramsSubject);
	} catch(err) {
		console.error(err);
		return {};
	}
};
