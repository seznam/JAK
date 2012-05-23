/**
 * @overview Třída starající se o upload jednoho souboru pomocí iframe. Samostatně se nevolá, vzužívá ji třída JAK.Uploader.
 * @version 1.0
 * @author ethan
 */
 
/**
 * @class Uploader.UploadIFrame
 * @group jak-widgets
 * @augments JAK.Uploader.Upload
 * @signal upload-start
 * @signal upload-end
 * @signal upload-progress
 */

JAK.Uploader.UploadIFrame = JAK.ClassMaker.makeClass({
	NAME: "JAK.Uploader.UploadIFrame",
	VERSION: "1.0",
	IMPLEMENT: JAK.ISignals,
	EXTEND: JAK.Uploader.Upload
});

/**
 * konstruktor
 * @param {object} conf
 * @param {string} [conf.url="/"] URL, na kterou se odešle soubor
 * @param {string} [conf.id] náhodné UID, které identifikuje daný upload, defaultní hodnota se náhodně vygeneruje
 * @param {string} [conf.input] element input, ve kterém je zvolen nějaký soubor
 */
JAK.Uploader.UploadIFrame.prototype.$constructor = function(conf) {
	this.$super(conf);
	
	if (this._conf.input) {
		this._dom.content = JAK.mel('div', {
			position: 'absolute',
			bottom: 0,
			height: '1px'
		});
		
		this._dom.form = this._conf.input.form;
		this._dom.form.target = this._conf.id;
		
		if (JAK.Browser.client == "ie" && parseInt(JAK.Browser.version) < 9) {
			this._dom.iframe = JAK.mel("<iframe name='" + this._conf.id + "'>");
		} else {
			this._dom.iframe = JAK.mel("iframe");
			this._dom.iframe.setAttribute("name", this._conf.id);
		}
		this._dom.content.appendChild(this._dom.iframe);

		document.body.appendChild(this._dom.content);
		
		var hashInput = JAK.mel('input', {
			type: 'hidden',
			name: 'hash',
			value: this._conf.id
		});
		this._dom.form.appendChild(hashInput);
		
		this._ec.push(JAK.Events.addListener(this._dom.iframe, "load", this._load.bind(this)));
		this.makeEvent('upload-start', {
			name: this._conf.input.value.replace(/^.*[\\\/]/, ''),
			id: this._conf.id
		});
		
		this._dom.form.submit();
	}
}

/**
 * destruktor
 */
JAK.Uploader.UploadIFrame.prototype.$destructor = function() {
	this.$super();
	// TODO: nasledujici radek by mel z DOMu odstranit uz nepotrebny div, ale kvuli Opere 11.x- to nedela
	//this._dom.content.parentNode.removeChild(this._dom.content);
}
