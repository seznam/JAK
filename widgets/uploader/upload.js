/**
 * @overview Abstraktní třída, ze které dědí třídy starající se o upload jednoho souboru
 * @version 1.0
 * @author ethan
 */
 
/**
 * @class Uploader.Upload
 * @group jak-widgets
 * @signal upload-start
 * @signal upload-end
 * @signal upload-progress
 */

JAK.Uploader.Upload = JAK.ClassMaker.makeClass({
	NAME: "JAK.Uploader.Upload",
	VERSION: "1.0",
	IMPLEMENT: JAK.ISignals
});

/**
 * konstruktor
 * @param {object} conf
 * @param {string} [conf.url="/"] URL, na kterou se odešle soubor
 * @param {string} [conf.id] náhodné UID, které identifikuje daný upload, defaultní hodnota se náhodně vygeneruje
 */
JAK.Uploader.Upload.prototype.$constructor = function(conf) {
	// konfigurace
	this._conf = {
		url: '/',
		id: JAK.idGenerator()
	};
	for (var p in conf) { this._conf[p] = conf[p]; }
	
	this._ec = [];
	this._sc = [];
	this._dom = {};
	
	this._sc.push(this.addListener('upload-abort-request', '_abort'));
}

/**
 * destruktor
 */
JAK.Uploader.Upload.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	this.removeListeners(this._sc);
}

/**
 * volá se v případě, že upload skončí úspěšně
 * @private
 */
JAK.Uploader.Upload.prototype._load = function(e) {
	this._end(JAK.Uploader.FINISHED);
}

/**
 * vysílá signál o postupu uploadu
 * @private
 */
JAK.Uploader.Upload.prototype._progress = function(e) {
	this.makeEvent('upload-progress', {
		id: this._conf.id,
		total: 0,
		loaded: 0
	});
}

/**
 * volá se v případě, že upload skončí chybou
 * @private
 */
JAK.Uploader.Upload.prototype._error = function(e) {
	this._end(JAK.Uploader.FAILED);
}

/**
 * reaguje na signál zrušení uploadu
 * @private
 */
JAK.Uploader.Upload.prototype._abort = function(data) {
	if (data.data.id && data.data.id == this._id) {
		this._end(JAK.Uploader.ABORTED);
	}
}

/**
 * posílá správný signál zakončení a ruší objekt uploadu
 * @private
 */
JAK.Uploader.Upload.prototype._end = function(status) {
	this.makeEvent('upload-end', {
		id: this._conf.id,
		status: status
	});
	this.$destructor();
}