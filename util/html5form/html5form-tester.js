/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Tester nativní podpory
 */
JAK.HTML5Form.SupportTester = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.SupportTester',
	'VERSION': '1.0'
});

JAK.HTML5Form.SupportTester.prototype.$constructor = function () {
	// výsledky proběhlých testů
	this._results = {};

	this._results.oninput = 'oninput' in JAK.mel('form');
	this._results.onpropertychange = 'onpropertychange' in JAK.mel('input');
};

/**
 * @method Vyhledá a zavolá vhodný test
 * @param {object} decorator Instance testovaného dekorátoru
 * @param {object} instance Instance JAK.HTML5Form.Element
 * @returns {boolean} Výsledek testu nativní podpory
 */
JAK.HTML5Form.SupportTester.prototype.test = function (decorator, instance) {
	var dname = typeof decorator == 'string' ? decorator : decorator.constructor.NAME.split('.').pop().toLowerCase();
	var nodeName = instance ? instance.elm.nodeName.toLowerCase() : null;

	if (dname in this._results) {
		if (typeof this._results[dname] == 'boolean') {
			return this._results[dname];
		} else {
			return this._results[dname][nodeName];
		}
	} else {
		if (dname.indexOf('input') != -1) {
			// testování podpory inputu
			this._testInput(dname);
			return this._results[dname];
		} else {
			if (dname == 'form') {
				// testování podpory atributu "form"
				this._testFormAttribute();
				return this._results[dname];
			} else {
				// testování ostatních atributů
				this._testAttribute(dname, nodeName);
				return this._results[dname][nodeName];
			}
		}
	}
};

/**
 * Metoda pro testování podpory inputu
 * @param {string} dname Jméno dekorátoru
 */
JAK.HTML5Form.SupportTester.prototype._testInput = function (dname) {
	var i = JAK.mel('input');
	var type = dname.replace('input', '');
	i.setAttribute('type', type);

	if (type == "number") {
		// IE10-11 má jen částečnou podporu number inputu
		try {
			i.value = 1;
			i.stepUp();
			this._results[dname] = true;
		} catch (err) {
			this._results[dname] = false;
		}
		return;
	}

	this._results[dname] = i.type == type;
};

/**
 * Metoda pro otestování atributu
 * @param {string} dname Jméno dekorátoru
 */
JAK.HTML5Form.SupportTester.prototype._testAttribute = function (dname, nodeName) {
	var attrName = dname == 'maxlength' ? 'maxLength' : dname;
	this._results[dname] = this._results[dname] || {};
	this._results[dname][nodeName] = (attrName in JAK.mel(nodeName));
};

/**
 * Metoda pro otestování podpory atributu "form"
 */
JAK.HTML5Form.SupportTester.prototype._testFormAttribute = function () {
	var form = JAK.mel('form');
	var input = JAK.mel('input');
	var div = JAK.mel('div');
	var r = false;

	form.id = 'formtest-' + JAK.idGenerator();
	input.setAttribute('form', form.id);

	div.appendChild(form);
	div.appendChild(input);

	document.body.appendChild(div);
	r = form.elements.length == 1 && input.form == form;
	div.parentNode.removeChild(div);

	this._results['form'] = r;
};
