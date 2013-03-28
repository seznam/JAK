/**
 * @overview Třída starající se o upload jednoho souboru pomocí iframe. Samostatně se nevolá, využívá ji třída JAK.Uploader.
 * @version 2.0
 * @author ethan
 */
 
/**
 * @class Uploader.UploadIFrame
 * @group jak-widgets
 * @augments JAK.Uploader.Upload
 */
JAK.Uploader.UploadIFrame = JAK.ClassMaker.makeClass({
	NAME: "JAK.Uploader.UploadIFrame",
	VERSION: "2.0",
	EXTEND: JAK.Uploader.Upload
});

/**
 * @param {object} conf
 * @param {string} conf.url="" URL, na kterou se odešle soubor
 * @param {string} conf.input element input, ve kterém je zvolen nějaký soubor
 * @param {string} [conf.id] náhodné UID, které identifikuje daný upload, defaultní hodnota se náhodně vygeneruje
 */
JAK.Uploader.UploadIFrame.prototype.$constructor = function(conf) {
	this.$super(conf);
	
	if (!this._conf.input || !this._conf.url) { return; }

	this._conf.input.form.target = this._conf.id;
	
	if (JAK.Browser.client == "ie" && parseInt(JAK.Browser.version) < 9) {
		this._dom.iframe = JAK.mel("<iframe name='" + this._conf.id + "'>");
	} else {
		this._dom.iframe = JAK.mel("iframe");
		this._dom.iframe.setAttribute("name", this._conf.id);
	}
	JAK.DOM.setStyle(this._dom.iframe, { display: 'none' });
	document.body.appendChild(this._dom.iframe);
	
	var hashInput = JAK.mel('input', {
		type: 'hidden',
		name: 'hash',
		value: this._conf.id
	});
	this._conf.input.form.appendChild(hashInput);
	
	this._ec.push(JAK.Events.addListener(this._dom.iframe, "load", this, '_load'));
	
	if (typeof this._conf.callbackStart == 'function') {
		this._conf.callbackStart({
			name: this._conf.input.value.replace(/^.*[\\\/]/, ''),
			id: this._conf.id
		});
	}
	
	this._conf.input.form.submit();
}

/**
 * iframe nepozná, zda byl upload v pořádku, takže prostě jen zareaguje na jeho load
 * @private
 */
JAK.Uploader.UploadIFrame.prototype._load = function(e) {
	if (this._dom.iframe.contentWindow) {
		try {
			var msg = this._dom.iframe.contentWindow.document.getElementsByTagName('body')[0].innerHTML;
			this._end(JAK.Uploader.FINISHED, msg);
		} catch (ex) {
			this._end(JAK.Uploader.FINISHED);
		}
	} else {
		this._end(JAK.Uploader.FINISHED);
	}
}

/**
 * zruší požadavek tak, že zavolá stop() na iframe
 * @private
 */
JAK.Uploader.UploadIFrame.prototype._cancelRequest = function(e) {
	if ('stop' in this._dom.iframe) {
		this._dom.iframe.stop();
	} else {
		this._dom.iframe.document.execCommand('Stop');
	}
}
