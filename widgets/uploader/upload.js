/**
 * @overview Abstraktní třída, ze které dědí třídy starající se o upload jednoho souboru
 * @version 2.0
 * @author ethan
 */
 
/**
 * @class Uploader.Upload
 * @group jak-widgets
 */
JAK.Uploader.Upload = JAK.ClassMaker.makeClass({
	NAME: "JAK.Uploader.Upload",
	VERSION: "2.0"
});

/**
 * konstruktor
 * @param {object} conf
 * @param {string} [conf.url=""] URL, na kterou se odešle soubor
 * @param {string} [conf.id] náhodné UID, které identifikuje daný upload, defaultní hodnota se náhodně vygeneruje
 */
JAK.Uploader.Upload.prototype.$constructor = function(conf) {
	// konfigurace
	this._conf = {
		url: '',
		id: (conf.id || JAK.idGenerator()),
		callbackStart: null,
		callbackProgress: null,
		callbackEnd: null
	};
	for (var p in conf) { this._conf[p] = conf[p]; }
	
	this._ec = [];
	this._dom = {};
}

JAK.Uploader.Upload.prototype.$destructor = function() {
	this._cancelRequest();
	JAK.Events.removeListeners(this._ec);
}

/**
 * volá se v případě, že upload skončí úspěšně
 * @private
 */
JAK.Uploader.Upload.prototype._load = function(e) {
	this._end(JAK.Uploader.FINISHED);
}

/**
 * při postupu uploadu zavolá příslušný callback
 * @private
 */
JAK.Uploader.Upload.prototype._progress = function(e) {
	if (typeof this._conf.callbackProgress == 'function') {
		this._conf.callbackProgress({
			id: this._conf.id,
			total: 0,
			loaded: 0
		});
	}
}

/**
 * volá se v případě, že upload skončí chybou
 * @private
 */
JAK.Uploader.Upload.prototype._error = function(e) {
	this._end(JAK.Uploader.FAILED);
}

/**
 * zruší upload a ukončí ho
 */
JAK.Uploader.Upload.prototype.abort = function() {
	this._cancelRequest();
	this._end(JAK.Uploader.ABORTED);
}

/**
 * vykoná se při ukončení uploadu a volá příslušný callback
 * @private
 */
JAK.Uploader.Upload.prototype._end = function(status, msg) {
	if (typeof this._conf.callbackEnd == 'function') {
		var data = {
			id: this._conf.id,
			status: status
		};
		if (msg) {
			data.msg = msg;
		}
		this._conf.callbackEnd(data);
	}
}

/**
 * zruší požadavek, každý potomek si ji implementuje sám
 * @private
 */
JAK.Uploader.Upload.prototype._cancelRequest = function() {
}
