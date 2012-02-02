/**
 * @overview Komponenta nabízející asynchronní upload souborů 
 * @version 1.0
 * @author ethan
 */
 
/**
 * @class Uploader
 * @group jak-widgets
 */
JAK.Uploader = JAK.ClassMaker.makeClass({
	NAME: "JAK.Uploader",
	VERSION: "1.0"
});

/**
 * konstanta značící, že upload byl dokončen v pořádku
 * @constant
 */
JAK.Uploader.FINISHED	= 4;
/**
 * konstanta značící, že upload byl dokončen, ale skončil chybou
 * @constant
 */
JAK.Uploader.FAILED		= 5;
/**
 * konstanta značící, že upload byl ukončen programem před dokončením
 * @constant
 */
JAK.Uploader.ABORTED	= 6;


/**
 * konstruktor třídy starající se o správu uploadů nad daným prvkem
 * @param {object} conf
 */
JAK.Uploader.prototype.$constructor = function(conf) {
	this._conf = {
		multiple: false,
		url: '/',
		button: '',
		inputName: 'upload'
	};
	for (var p in conf) { this._conf[p] = conf[p]; }
	
	// ruzne detekce - ukradeno z emailu
	this._isDraggable = ("draggable" in JAK.mel('div'));				/* zjistim zda umim pretahovat dle HTML 5 */
	this._isFiles = ('files' in JAK.mel('input',{type:'file'}));		/* umim pristupovat k souborum v input type=file ? */
	this._supportsAjax = (this._isDraggable && this._isFiles);			/* znam vsechny feature pro ajaxovy upload ? */
	this._multiple = this._supportsAjax && this._conf.multiple && ('multiple' in JAK.mel('input',{type:'file'}));	/* umim mutiple input ? */
	
	this._dom = {};
	this._ec = [];
	this._ne = {
		change: null,
		click: null
	};
	
	this._build();
	this.setButton(this._conf.button);
	
	this._ec.push(JAK.Events.addListener(window, "unload", this, "$destructor"));
}

/**
 * destruktor
 */
JAK.Uploader.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	if (this._ne.change) { JAK.Events.removeListener(this._ne.change); }
	if (this._ne.click) { JAK.Events.removeListener(this._ne.click); }
}

/**
 * metoda, pomocí které lze změnit prvek, který slouží jako tlačítko pro výběr souborů
 * @param {HTMLElement || string} elm - element, na který se věší click událost, nebo se obaluje labelem
 */
JAK.Uploader.prototype.setButton = function(elm) {
	if (this._ne.click) { JAK.Events.removeListener(this._ne.click); }
	if (this._dom.label && this._dom.button) {
		this._dom.label.parentNode.appendChild(this._dom.button);
		this._dom.label.parentNode.removeChild(this._dom.label);
	}
	this._dom.button = JAK.gel(elm);
	
	if (this._dom.button) {
		if (this._dom.label) {
			// label obalujici button, aby vse slo hladce
			this._dom.button.parentNode.appendChild(this._dom.label);
			this._dom.label.appendChild(this._dom.button);
		} else {
			// XHR reseni nevyzaduje label a naopak funguje click
			this._ne.click = JAK.Events.addListener(this._dom.button, 'click', function(e, elm) {
				this._dom.input.click();
			}.bind(this));
		}
		this._buildInput();
	}
}

/*
 * ovladač události, který spustí ve chvíli, kdy se změní hodnota inputu
 * @private
 */
JAK.Uploader.prototype._change = function(e) {
	if (this._dom.input.value) {
		if (this._supportsAjax) {
			for (var i = 0; i < this._dom.input.files.length; i++) {
				new JAK.Uploader.UploadXHR({
					file: this._dom.input.files[i],
					url: this._conf.url
				});
			}
		} else {
			new JAK.Uploader.UploadIFrame({
				input: this._dom.input,
				url: this._conf.iframeUrl || this._conf.url
			});
		}
	}
	
	// prepsani stareho inputu novym, aby stara hodnota nezamezila znovuodeslani stejneho souboru
	this._buildInput();
}

/**
 * vytvoření potřebného HTML, které bude obalovat input a zajišťovat klikatelnost u iframe řešení
 * @private
 */
JAK.Uploader.prototype._build = function() {
	// vytvorime kontainer na input
	this._dom.form = JAK.mel('div', {}, {
		position: 'absolute',
		visibility: 'hidden',
		top: 0,
		left: 0,
		width: '1px',
		height: '1px',
		overflow: 'hidden'
	});
	
	if (this._supportsAjax) {
		document.body.appendChild(this._dom.form);
	} else {
		this._dom.label = JAK.mel('label', {}, {
			position: 'relative'
		});
		this._dom.label.appendChild(this._dom.form);
		document.body.appendChild(this._dom.label);
	}
}

/**
 * vytvoření uploadovacího inputu
 * @private
 */
JAK.Uploader.prototype._buildInput = function() {
	// odveseni udalosti
	if (this._ne.change) { JAK.Events.removeListener(this._ne.change); }
	
	// novy input
	var iid = JAK.idGenerator();
	this._dom.input = JAK.mel('input', {
		type: 'file',
		name: this._conf.inputName,
		id: iid
	});
	if (this._multiple) { this._dom.input.multiple = 'multiple'; }
	this._dom.form.appendChild(this._dom.input);
	
	if (this._dom.label) { this._dom.label.setAttribute('for', iid); }
	
	this._ne.change = JAK.Events.addListener(this._dom.input, 'change', this._change.bind(this));
}