
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
