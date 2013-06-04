/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class kontrola pravopisu
 * @augments JAK.EditorControl.Interactive
 */
JAK.EditorControl.SpellCheck = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.SpellCheck",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.Interactive
});

JAK.EditorControl.SpellCheck.prototype.$constructor = function(owner, options) {
	this.$super(owner, options);

	this.id = JAK.idGenerator();
	this.httpRequestId = 0;
	this.languageSelectIsVisible = false; //zda je otevreno okno s vyberem jazyka
	this.selectedLanguage = null; //jaky jazyk je vybran pro validaci (cs,en)
	this.continueToValidate = false; //pokud chce uzivatel validovat ale neni vybran jazyk, tak je zde true a pri vyberu jazyka pokracuji ve validaci
	this.badWordDic = {}; //je to asociativni pole kde klicem je nenalezene slovo a hodnotou je pole jednotlivych span elementu oznacujicich spatna slova

	this.owner.addStyle('span.spellcheckbadword {background-image:url('+this.owner.options.imagePath+'/wline.gif); background-repeat:repeat-x; background-position: bottom;}');

	//naveseni na ziskani obsahu editoru
	this.owner.registerGetContentHook(this, 'editorGetContentHook');
}


JAK.EditorControl.SpellCheck.prototype.$destructor = function() {

	this.selectedLanguage = null;

	for (var k in this.badWordDic) {
		var a = this.badWordDic[k];
		for (var i = 0; i < a.length; i++) {
			a[i].$destructor();
		}
	}

	this.$super();
}


JAK.EditorControl.SpellCheck.prototype.refresh = function() {
	this.$super();

	//schovat okno s vyberem jazyka
	if (this.languageSelectIsVisible) {
		this._closeLanguageSelect();
	}

	//je li otevreno okno s nahradou slova, schovam
	for (var k in this.badWordDic) {
		var a = this.badWordDic[k];
		for (var i = 0; i < a.length; i++) {
			a[i].close();
		}
	}
}


/**
 * vytvoreni obalu obrazku a pridani sipky
 */
JAK.EditorControl.SpellCheck.prototype._build = function() {
	this.$super();

	var span = JAK.cel('span');
	this.dom.button =  this.dom.container;
	span.appendChild(this.dom.button);

	var arrow = JAK.cel('img', 'arrow');
	arrow.src = this.owner.options.imagePath + this.options.opt.arrowImage;
	arrow.style.cursor = 'pointer';

	this.dom.arrow = arrow;
	span.appendChild(arrow);
	
	this.dom.container = span;
}

/**
 * prepsani metody pro pridani mouseoveru
 * @param {elm} obalujici prvek obou buttonku, nepotrebujeme
 */
JAK.EditorControl.SpellCheck.prototype._addMouseEvents = function(elm) {
	this.ec.push(JAK.Events.addListener(this.dom.button,"mouseover",this,"_mouseover",false,true));
	this.ec.push(JAK.Events.addListener(this.dom.button,"mouseout",this,"_mouseout",false,true));
	this.ec.push(JAK.Events.addListener(this.dom.button,"click",this,"_buttonClick",false,true));
	this.ec.push(JAK.Events.addListener(this.dom.arrow,"mouseover",this,"_mouseover",false,true));
	this.ec.push(JAK.Events.addListener(this.dom.arrow,"mouseout",this,"_mouseout",false,true));
	this.ec.push(JAK.Events.addListener(this.dom.arrow,"click",this,"_arrowClick",false,true));
}

JAK.EditorControl.SpellCheck.prototype._arrowClick = function(e, elm) {
	if (!this.languageSelectIsVisible ) { document.b = this;
		this.languageSelectIsVisible = true;
		this._createLanguageSelect();
	} else {
		this._closeLanguageSelect();
	}
}

JAK.EditorControl.SpellCheck.prototype._createLanguageSelect = function() {
	if (this.dom.languageSelect == null) {
		JAK.DOM.addClass(this.dom.arrow, 'pressed');

		var pos = JAK.DOM.getBoxPosition(this.dom.arrow);   //jen oproti rodici, protoze rodic je relativne stylovan

	   var div = JAK.cel('div', 'editor-spellcheck-languages');
		div.style.position = 'absolute';
		div.style.left = pos.left+'px';
		div.style.top = pos.top+this.dom.arrow.offsetHeight+'px';
		div.style.zIndex = 1;

		div.innerHTML = '<div class="header-languages">'+this.options.text[1]+'</div>';
		for (var i = 0; i < this.options.opt.languages.length; i++) {
			var lang = JAK.cel('div', 'item-languages');
			lang.id = this.options.opt.languages[i].code;
			lang.innerHTML = this.options.opt.languages[i].name;
			lang.style.cursor = 'pointer';
			if (this.selectedLanguage == this.options.opt.languages[i].code){
				JAK.DOM.addClass(lang, 'selected-language');
			}
			div.appendChild(lang);

			this.ec.push(JAK.Events.addListener(lang,"mouseover",this,"_langmouseover",false,true));
			this.ec.push(JAK.Events.addListener(lang,"mouseout",this,"_langmouseout",false,true));
			this.ec.push(JAK.Events.addListener(lang,"click",this,"_langClick",false,true));
		}

		this.dom.languageSelect = div;
		var body = document.getElementsByTagName('body')[0];
		body.appendChild(this.dom.languageSelect);

	} else {
		var langDiv = document.getElementById(this.selectedLanguage);
		if (langDiv) {
			var selL =  JAK.DOM.getElementsByClass('selected-language');
			if (selL[0]) {
				JAK.DOM.removeClass(selL[0], 'selected-language' );
			}
			JAK.DOM.addClass(langDiv, 'selected-language');
		}
	}
	this.dom.languageSelect.style.display = 'block';
}

JAK.EditorControl.SpellCheck.prototype._langmouseover = function(e, elm) {
	JAK.DOM.addClass(elm,"mouseover-languages");
}

JAK.EditorControl.SpellCheck.prototype._langmouseout = function(e, elm) {
	JAK.DOM.removeClass(elm,"mouseover-languages");
}

JAK.EditorControl.SpellCheck.prototype._langClick = function(e, elm) {
	this.selectedLanguage = elm.id;
	this._closeLanguageSelect();

	//take mohl byt dialog vyberu jazyka otevren z ikony validace, pak ve validaci pokracuji
	if (this.continueToValidate) {
		this.continueToValidate = false;
		this.validateSource();
	}
}

/**
 * schova vyber jazyka
 */
JAK.EditorControl.SpellCheck.prototype._closeLanguageSelect = function() {
	JAK.DOM.removeClass(this.dom.arrow, 'pressed');
	this.dom.languageSelect.style.display = 'none';
	this.languageSelectIsVisible = false;
}


//--------------BUTTON---------------

/**
 * kliknuti na butonek spellchecku
 * @param e
 * @param elm
 */
JAK.EditorControl.SpellCheck.prototype._buttonClick = function(e, elm) {
	if (JAK.DOM.hasClass(elm, 'pressed')) {
		JAK.DOM.removeClass(elm, 'pressed');
		//odrovnat spellcheck
		this.removeAllBadWords(true);
	} else {
		if (!this.selectedLanguage) {
			this.continueToValidate = true;
			this._createLanguageSelect();
		} else {
			this.validateSource();
		}
	}
}

JAK.EditorControl.SpellCheck.prototype.validateSource = function() {
	JAK.DOM.addClass(this.dom.button, 'pressed');

	var text = this.owner.getContent();
	text = text.replace(/<br[ ]*\/?>/g," ");
	text = text.replace(/<[^>]+>/g,"");

	var rq = new JAK.Request(JAK.Request.XML, {method:"post"});
	rq.setCallback(this, "parseSpellCheck");
	rq.send(this.options.opt.spellCheckUrl, 'id='+this.id+'_spellcheck&cmd=spell&lang='+this.selectedLanguage+'&check='+encodeURIComponent(text));
}

JAK.EditorControl.SpellCheck.prototype.parseSpellCheck = function(xml, status) {
	if (status == 200 && xml !== null) {
		if (xml.documentElement.firstChild) { //pokud jsou nejaka divna slova
			var result = xml.documentElement.firstChild.nodeValue;
			result = decodeURIComponent(result);
			var resArray = this._prepareBadWordArray(result);

			var txt = this.owner.getContent();
			for (var i = 0; i < resArray.length; i++) {
				this.badWordDic[resArray[i]] = [];
				txt = this.underlineBadWord(txt, resArray[i]);
			}
			this.owner.setContent(txt);

			//na vsechny spany navesit udalost a poznamenat si je
			this.manageBadWords();
		}

	//nastala chyba
	} else {
		JAK.DOM.removeClass(this.dom.button, 'pressed');
	}
}

/**
 * retezec prevede na pole, ktere ma kazdou cast pouze jednou "a b a c" => [a,b,c]
 * @param result
 */
JAK.EditorControl.SpellCheck.prototype._prepareBadWordArray = function(result) {
	var oArray = result.split('+');
	var obj = {};
	var resArray = [];

	oArray.forEach(function(item){obj[item] = 1;});
	for (var k in obj) {
		resArray.push(k);
	}

	return resArray;
}


JAK.EditorControl.SpellCheck.prototype.underlineBadWord = function(txt, word) {
	var regExp = new RegExp('\\b'+word+'\\b','g');
	txt = txt.replace(regExp, '<span class="spellcheckbadword">'+word+'</span>');
	return txt;
}

JAK.EditorControl.SpellCheck.prototype.manageBadWords = function() {
	var e = this.owner.getContainer();
	var spans = JAK.DOM.getElementsByClass("spellcheckbadword",e);
	for (var i = 0; i < spans.length; i++) {
		if (!(this.badWordDic[spans[i].innerHTML] instanceof Array)) {
			this.badWordDic[spans[i].innerHTML] = [];
		}
		var w = new JAK.EditorControl.SpellCheck.Word(this, spans[i]);
		this.badWordDic[spans[i].innerHTML].push(w);

	}
}

/**
 * navesena udalost na ziskani obsahu editoru, vycistnime predany text od spanu 
 * co si vytvarime 
 */
JAK.EditorControl.SpellCheck.prototype.editorGetContentHook = function(txt) {
	//this.removeAllBadWords(true);
	var regExp = new RegExp('<span class="spellcheckbadword">([\s\S]*?)</span>','g'); /* .*? otaznik dela to ze vyraz neni zravy*/
	txt = txt.replace(regExp, '$1');
	return txt;
}


/**
 * odebere objekt slova ze seznamu slov
 * @param word
 */
JAK.EditorControl.SpellCheck.prototype.removeBadWord = function(word) {
	for (var k in this.badWordDic) {
		var a = this.badWordDic[k];
		for (var i = 0; i < a.length; i++) {
			if (a[i] == word) {
				a.splice(i,1);
			}
		}
	}
}


/**
 * odebere vsechny objekty daneho slova ze seznamu slov
 * @param word
 */
JAK.EditorControl.SpellCheck.prototype.removeAllBadWords = function(strWord) {
	for (var k in this.badWordDic) {
		if (strWord == true || k == strWord) {
			var a = this.badWordDic[k];
			for (var i = 0; i < a.length; i++) {
				try {
					this.owner.selectNode(a[i].elm);
					//a[i].ignoreWord();
					var selSpan = this.owner.getSelectedNode();
					var txt = JAK.ctext(a[i].word);
					selSpan.parentNode.replaceChild(txt, selSpan);
				} catch (e) {
					//muze se stat, ze uzivatel editoval dokument a uz tam ty elementy nejsou, pak to huci na chybe
				}
				a[i].$destructor();
			}
			this.badWordDic[k] = [];
		}
	}
}


//--------------WORD----------------
/**
 * jedno konkretni oznacene slovo
 * @private
 * @group jak-widgets
 */
JAK.EditorControl.SpellCheck.Word = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.SpellCheck.Word",
	VERSION: "2.0"
});

JAK.EditorControl.SpellCheck.Word.prototype.$constructor = function(owner, elm) {
	this.elm = elm; //span element obalujici slovo
	this.owner = owner; //SpellCheck plugin
	this.spellCheckUrl = this.owner.options.opt.spellCheckUrl;
	this.word = elm.innerHTML; //slovo co nahrazuji
	this.ec = []; //zasobnik udalosti
	this.dom = {}; //uchovava odkazy na menu
	this.id = JAK.idGenerator();

	this.ec.push(JAK.Events.addListener(elm, 'click', this, 'click', false, true));
	this.ec.push(JAK.Events.addListener(elm, 'contextmenu', this, 'click', false, true));
	this.ec.push(JAK.Events.addListener(document, 'click', this,'close', false, true));
	if (this.owner.owner.getInstance() instanceof JAK.Editor.Instance.Iframe) {
		var ifr = this.owner.owner.getInstance().ifr;
		this.ec.push(JAK.Events.addListener(ifr, 'click', this,'close', false, true));
	}
}

JAK.EditorControl.SpellCheck.Word.prototype.$destructor = function() {
	for (var i = 0; i < this.ec.length; i++) {
		JAK.Events.removeListener(this.ec[i]);
	}

	for (k in this.dom) {
		this.dom[k] = null;
	}
}


JAK.EditorControl.SpellCheck.Word.prototype.close = function(e, elm) {
	if (this.dom.elm && this.dom.elm.parentNode) {
		this.dom.elm.parentNode.removeChild(this.dom.elm);
	}
}

JAK.EditorControl.SpellCheck.Word.prototype.click = function(e, elm) {
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
	this.owner.owner.selectNode(this.elm);
	this.renderForm();
}

JAK.EditorControl.SpellCheck.Word.prototype.renderForm = function() {
	var div = JAK.cel('div', 'editor-badWordMenu');
	var header = JAK.cel('div', 'editor-badWordMenuHeader');
	header.innerHTML = this.owner.options.text[2];
	div.appendChild(header);
	var content = JAK.cel('div');
	div.appendChild(content);


	this.dom.header = header;
	this.dom.content = content;
	this.dom.elm = div;

	//pripnout do stromu
	var pos = {top: 0, left: 0};
	var inst = this.owner.owner.getInstance();
	if (inst instanceof JAK.Editor.Instance.Iframe) {    //ty co maji iframe (FF)
		pos = JAK.DOM.getBoxPosition(this.elm, inst.ifr);
		var ipos = JAK.DOM.getBoxPosition(inst.ifr);
		pos.top += ipos.top;
		pos.left += ipos.left;
	} else { //ty s contenteditable DIVem
		pos = JAK.DOM.getBoxPosition(this.elm);
	}

	pos.top += this.elm.offsetHeight;

	div.style.position = 'absolute';
	div.style.top = pos.top+'px';
	div.style.left = pos.left+'px';
	document.getElementsByTagName('body')[0].appendChild(div);

	/*this.dom.container = div;
	this.dom.header = header;
	this.dom.content = content; */

	this.requestSuggest();
}

JAK.EditorControl.SpellCheck.Word.prototype.requestSuggest = function() {
	var rq = new JAK.Request(JAK.Request.XML, {method:"post"});
	rq.setCallback(this, "parseSuggest");
	rq.send(this.spellCheckUrl, 'id='+this.id+'_suggest&cmd=suggest&lang='+this.owner.selectedLanguage+'&check='+encodeURIComponent(this.word));
}

JAK.EditorControl.SpellCheck.Word.prototype.parseSuggest = function(xml, status) {
	if (status == 200 && xml !== null) {
		      window.x = xml;
		if (xml.documentElement.childNodes.length > 0) {
			var result = xml.documentElement.firstChild.nodeValue;
			result = decodeURIComponent(result);
			var resArray = result.split('+');
			if (resArray.length > 0) {

				for (var i = 0; i < resArray.length; i++) {
					var div = JAK.cel('div', 'editor-suggestWord');
					div.innerHTML = resArray[i];
					this.ec.push(JAK.Events.addListener(div, 'click', this, 'suggestWordClick', false, true));
					this.ec.push(JAK.Events.addListener(div, 'mouseover', this, 'suggestWordMouseOver', false, true));
					this.ec.push(JAK.Events.addListener(div, 'mouseout', this, 'suggestWordMouseOut', false, true));
					this.dom.content.appendChild(div);
				}

				this.dom.header.innerHTML = this.owner.options.text[5];

				//ignorovat slovo
				var div = JAK.cel('div', 'editor-suggestWord');
				div.innerHTML = this.owner.options.text[6];
				this.ec.push(JAK.Events.addListener(div, 'click', this, 'ignoreWord', false, true));
				this.ec.push(JAK.Events.addListener(div, 'mouseover', this, 'suggestWordMouseOver', false, true));
				this.ec.push(JAK.Events.addListener(div, 'mouseout', this, 'suggestWordMouseOut', false, true));
				this.dom.content.appendChild(div);
				//ignorovat vse
				var div = JAK.cel('div', 'editor-suggestWord');
				div.innerHTML = this.owner.options.text[7];
				this.ec.push(JAK.Events.addListener(div, 'click', this, 'ignoreAll', false, true));
				this.ec.push(JAK.Events.addListener(div, 'mouseover', this, 'suggestWordMouseOver', false, true));
				this.ec.push(JAK.Events.addListener(div, 'mouseout', this, 'suggestWordMouseOut', false, true));
				this.dom.content.appendChild(div);
				//todo ie nezobrazuje
				this.dom.elm.style.display = 'none';
				this.dom.elm.style.display = 'block';
			} else {
				this.dom.header.innerHTML = this.owner.options.text[4];
			}
		} else {
			this.dom.header.innerHTML = this.owner.options.text[4];
		}


	//nastala chyba
	} else {
		this.dom.content.innerHTML = this.owner.options.text[3];
	}
}

/**
 * prepsani slova v editoru vyberem
 * @param e
 * @param elm
 */
JAK.EditorControl.SpellCheck.Word.prototype.suggestWordClick = function(e, elm) {
	//var selSpan = this.owner.owner.getSelectedNode();
	var selSpan = this.elm;
	var txt = JAK.ctext(elm.innerHTML);
	selSpan.parentNode.replaceChild(txt, selSpan);
   this.deleteWord();
}

JAK.EditorControl.SpellCheck.Word.prototype.ignoreWord = function(e, elm) {
	var selSpan = this.owner.owner.getSelectedNode();
	var txt = JAK.ctext(this.word);
	selSpan.parentNode.replaceChild(txt, selSpan);

	this.deleteWord();
}

JAK.EditorControl.SpellCheck.Word.prototype.ignoreAll = function(e, elm) {
	this.close();
	this.owner.removeAllBadWords(this.word);
}

JAK.EditorControl.SpellCheck.Word.prototype.deleteWord = function() {
	this.close();
	//todo vymazani tohoto objektu z rodice
	this.owner.removeBadWord(this);
	this.$destructor();
}

JAK.EditorControl.SpellCheck.Word.prototype.suggestWordMouseOver = function(e, elm) {
	JAK.DOM.addClass(elm, 'editor-badWordMenu-mouseOver');
}

JAK.EditorControl.SpellCheck.Word.prototype.suggestWordMouseOut = function(e, elm) {
	JAK.DOM.removeClass(elm, 'editor-badWordMenu-mouseOver');
}


//---------NABINDOVANI-------
JAK.EditorControls["spellcheck"] = {object:JAK.EditorControl.SpellCheck, image:"plugins/spellcheck.gif"};
