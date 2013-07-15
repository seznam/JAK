describe ('HTML5Form', function () {
	var createForm = function (elements) {
		var form = JAK.mel('form', {'id': 'form'}, {'width': '50px'});
		var url = JAK.mel('input', {'id': 'url', 'type': 'url', 'name': 'url'});
		var email = JAK.mel('input', {'id': 'email', 'type': 'email', 'name': 'email', 'multiple': 'true'});
		var number = JAK.mel('input', {'id': 'number', 'type': 'number', 'name': 'number'});
		var pattern = JAK.mel('input', {'id': 'pattern', 'type': 'text', 'name': 'pattern'})
		var color = JAK.mel('input', {'id': 'color', 'type': 'color', 'name': 'color'});
		var date = JAK.mel('input', {'id': 'date', 'type': 'date', 'name': 'date'});
		var range = JAK.mel('input', {'id': 'range', 'type': 'range', 'name': 'range', 'value': '0'});
		var textarea = JAK.mel('textarea', {'id': 'textarea', 'placeholder': 'placeholder text', 'name': 'textarea'});
		var submit = JAK.mel('input', {'id': 'submit', 'type': 'submit'});
		var reset = JAK.mel('input', {'id': 'reset', 'type': 'reset'});

		var outerselect = JAK.mel('select', {'id': 'outer-select', 'name': 'outer-select', 'innerHTML': '<option value="1">1</option><option value="2">2</option>'});
		var outerradio1 = JAK.mel('input', {'id': 'outer-radio1', 'type': 'radio', 'name': 'outer-radio', 'value': '1', 'checked': 'true'});
		var outerradio2 = JAK.mel('input', {'id': 'outer-radio2', 'type': 'radio', 'name': 'outer-radio', 'value': '2'});
		var outercheckbox = JAK.mel('input', {'id': 'outer-checkbox', 'type': 'checkbox', 'name': 'outer-checkbox'});
		var outerinput = JAK.mel('input', {'id': 'outer-input', 'type': 'text', 'name': 'outer-input', 'value': 'výchozí'});

		number.setAttribute('step', 1);
		number.setAttribute('min', 0);
		number.setAttribute('max', 10);
		pattern.setAttribute('pattern', '[0-9][A-Z]{3}');
		pattern.setAttribute('required', '');
		range.setAttribute('step', 1);
		range.setAttribute('min', 0);
		range.setAttribute('max', 10);
		textarea.setAttribute('maxlength', 5);
		outerselect.setAttribute('form', 'form');
		outerradio1.setAttribute('form', 'form');
		outerradio2.setAttribute('form', 'form');
		outercheckbox.setAttribute('form', 'form');
		outerinput.setAttribute('form', 'form');

		form.appendChild(url);
		form.appendChild(email);
		form.appendChild(number);
		form.appendChild(pattern);
		form.appendChild(color);
		form.appendChild(date);
		form.appendChild(range);
		form.appendChild(textarea);
		form.appendChild(submit);
		form.appendChild(reset);

		JAK.gel('test_box').appendChild(form);
		JAK.gel('test_box').appendChild(outerselect);
		JAK.gel('test_box').appendChild(outerradio1);
		JAK.gel('test_box').appendChild(outerradio2);
		JAK.gel('test_box').appendChild(outercheckbox);
		JAK.gel('test_box').appendChild(outerinput);

		instance = new JAK.HTML5Form(form);

		SignalListener = JAK.ClassMaker.makeSingleton({
			'NAME': 'SignalListener',
			'VERSION': '1.0',
			'IMPLEMENT': [JAK.ISignals]
		});

		signalListener = SignalListener.getInstance();
	};

	var getData = function (id) {
		return {
			'inp': JAK.gel('form').querySelector('#'+id),
			'ins': instance.getElement(id)
		}
	};

	it ('should create instance of "JAK.HTML5Form"', function() {
		createForm();
		expect(instance instanceof JAK.HTML5Form).toEqual(true);
	});

	it ('should have "getElement" method which should return JAK.HTML5Form.Element instance', function () {
		expect(instance.getElement('url') instanceof JAK.HTML5Form.Element).toEqual(true);
	});

	it ('should have "checkValidity" method which should return validation status', function () {
		expect(instance.checkValidity()).toEqual(false);
		JAK.gel('pattern').value = '0AAA';
		JAK.gel('color').value = '#AAAAAA';
		expect(instance.checkValidity()).toEqual(true);
	});

	it ('should change values of outer elements to their default value when reset event is triggered', function () {
		if (!JAK.HTML5Form.SupportTester.getInstance().test('form')) {
			instance.getElement('outer-select').selectedIndex = 1;
			instance.getElement('outer-radio2').checked = true;
			instance.getElement('outer-checkbox').checked = true;
			instance.getElement('outer-input').value = 'změněno';

			JAK.HTML5Form.Decorators.Form.getInstance()._reset(instance.getElement('outer-select'));
			JAK.HTML5Form.Decorators.Form.getInstance()._reset(instance.getElement('outer-radio1'));
			JAK.HTML5Form.Decorators.Form.getInstance()._reset(instance.getElement('outer-radio2'));
			JAK.HTML5Form.Decorators.Form.getInstance()._reset(instance.getElement('outer-checkbox'));
			JAK.HTML5Form.Decorators.Form.getInstance()._reset(instance.getElement('outer-input'));

			expect(JAK.gel('outer-select').selectedIndex).toEqual(0);
			expect(JAK.gel('outer-radio1').checked).toEqual(true);
			expect(JAK.gel('outer-radio2').checked).toEqual(false);
			expect(JAK.gel('outer-checkbox').checked).toEqual(false);
			expect(JAK.gel('outer-input').value).toEqual('výchozí');
		}
	});

	describe ('URL input', function () {
		it ('should validate URL address', function () {
			var data = getData('url');
			data.inp.value = 'aaa';
			expect(data.ins.validity('typeMismatch')).toEqual(true);
			data.inp.value = 'http://seznam.cz';
			expect(data.ins.validity('typeMismatch')).toEqual(false);
		});
	});

	describe ('Email input', function () {
		it ('should validate inserted value ', function () {
			var data = getData('email');
			data.inp.value = 'aaa';
			expect(data.ins.validity('typeMismatch')).toEqual(true);
			data.inp.value = 'info@seznam.cz';
			expect(data.ins.validity('typeMismatch')).toEqual(false);
		});

		it ('should allow to insert multiple emails', function () {
			var data = getData('email');
			data.inp.value = 'info@seznam.cz, podporaznam.cz';
			expect(data.ins.validity('typeMismatch')).toEqual(true);
			data.inp.value = 'info@seznam.cz, podpora@seznam.cz';
			expect(data.ins.validity('typeMismatch')).toEqual(false);
		});
	});

	describe ('Number input', function () {
		it ('should have stepUp and stepDown methods', function () {
			var data = getData('number');
			data.inp.value = 0;
			data.ins.stepUp(2);
			expect(data.inp.value).toEqual('2');
			data.ins.stepDown(1);
			expect(data.inp.value).toEqual('1');
		});
	});

	describe ('Range input', function () {
		it ('should have "stepUp", "stepDown" and "setValue" methods', function () {
			var data = getData('range');
			data.ins.stepUp('1');
			expect(data.inp.value).toEqual('1');
			data.ins.stepDown('1');
			expect(data.inp.value).toEqual('0');
			data.ins.setValue('10');
			expect(data.inp.value).toEqual('10');
		});

		it ('should fire "change" and "input" signal when value is selected from JAK.Slider widget', function () {
			var data = getData('range');
			if (data.ins._slider) {
				changeSignal = false;
				inputSignal = false

				waitsFor(function () {
					return changeSignal;
				}, '', 100);

				var bound = (function() {
					changeSignal = true;
					inputSignal = true;
				}).bind(this);

				signalListener.addListener('change', bound, data.ins);
				data.ins._slider.makeEvent('change');

				runs(function() {
					expect(changeSignal).toEqual(true);
					expect(inputSignal).toEqual(true);
				});
			}
		});
	});

	describe ('Date input', function () {
		it ('should fire "change" and "input" signals when date is picked from JAK.Calendar widget', function () {
			var data = getData('date');
			if (data.ins._calendar) {
				changeSignal = false;
				inputSignal = false

				waitsFor(function () {
					return changeSignal;
				}, '', 100);

				var bound = (function() {
					changeSignal = true;
					inputSignal = true;
				}).bind(this);

				signalListener.addListener('change', bound, data.ins);
				data.ins._calendar.makeEvent('datepick');

				runs(function() {
					expect(changeSignal).toEqual(true);
					expect(inputSignal).toEqual(true);
				});
			}
		});
	});

	describe ('Color input', function () {
		it ('should fire "change" and "input" signals when color is selected from JAK.ColorPicker widget', function () {
			var data = getData('color');
			if (data.ins._colorpicker) {
				changeSignal = false;
				inputSignal = false

				waitsFor(function () {
					return changeSignal;
				}, '', 100);

				var bound = (function() {
					changeSignal = true;
					inputSignal = true;
				}).bind(this);

				signalListener.addListener('change', bound, data.ins);
				data.ins._colorpicker.makeEvent('colorselect');

				runs(function() {
					expect(changeSignal).toEqual(true);
					expect(inputSignal).toEqual(true);
				});
			}
		});
	});

	describe ('Step attribute', function () {
		it ('should validate inserted value', function () {
			var data = getData('number');
			data.inp.value = '5.5';
			expect(data.ins.validity('stepMismatch')).toEqual(true);
			data.inp.value = '5';
			expect(data.ins.validity('stepMismatch')).toEqual(false);

			data = getData('range');
			if (data.ins._slider) {
				data.ins.setValue('5.5');
				expect(data.ins.validity('stepMismatch')).toEqual(true);
				data.ins.setValue('5');
				expect(data.ins.validity('stepMismatch')).toEqual(false);
			}
		});
	});

	describe ('Min attribute', function () {
		it ('should be invalid if inserted value is smaller', function () {
			var data = getData('number');
			data.inp.value = '-5';
			expect(data.ins.validity('rangeUnderflow')).toEqual(true);
			data.inp.value = '5';
			expect(data.ins.validity('rangeUnderflow')).toEqual(false);

			data = getData('range');
			if (data.ins._slider) {
				data.ins.setValue('-5');
				expect(data.ins.validity('rangeUnderflow')).toEqual(true);
				data.ins.setValue('5');
				expect(data.ins.validity('rangeUnderflow')).toEqual(false);
			}
		});
	});

	describe ('Max attribute', function () {
		it ('should be invalid if inserted value is greater', function () {
			var data = getData('number');
			data.inp.value = '11';
			expect(data.ins.validity('rangeOverflow')).toEqual(true);
			data.inp.value = '5';
			expect(data.ins.validity('rangeOverflow')).toEqual(false);

			data = getData('range');
			if (data.ins._slider) {
				data.ins.setValue('11');
				expect(data.ins.validity('rangeOverflow')).toEqual(true);
				data.ins.setValue('5');
				expect(data.ins.validity('rangeOverflow')).toEqual(false);
			}
		});
	});

	describe ('Pattern attribute', function () {
		it ('should be invalid if value does not match pattern', function () {
			var data = getData('pattern');
			data.inp.value = 'aaa';
			expect(data.ins.validity('patternMismatch')).toEqual(true);
			data.inp.value = '0AAA';
			expect(data.ins.validity('patternMismatch')).toEqual(false);
		});
	});

	describe ('Required attribute', function () {
		it ('should not allow to leave the input unfilled', function () {
			var data = getData('pattern');
			data.inp.value = '';
			expect(data.ins.validity('valueMissing')).toEqual(true);
			data.inp.value = 'aaa';
			expect(data.ins.validity('valueMissing')).toEqual(false);
		});
	});

	describe ('Maxlength attribute', function () {
		it ('should be invalid if value has more characters', function () {
			var data = getData('textarea');
			data.inp.value = 'více než 5 znaků';
			expect(data.ins.validity('tooLong')).toEqual(true);
			data.inp.value = 'aaa';
			expect(data.ins.validity('tooLong')).toEqual(false);
		});
	});

	describe ('Form attribute', function () {
		it ('should process elements placed outside form', function () {
			expect(instance.getElement('outer-select') instanceof JAK.HTML5Form.Element).toEqual(true);
			expect(instance.getElement('outer-radio1') instanceof JAK.HTML5Form.Element).toEqual(true);
			expect(instance.getElement('outer-radio2') instanceof JAK.HTML5Form.Element).toEqual(true);
			expect(instance.getElement('outer-checkbox') instanceof JAK.HTML5Form.Element).toEqual(true);
			expect(instance.getElement('outer-input') instanceof JAK.HTML5Form.Element).toEqual(true);
		});
	});

	it ('should be able to unset all elements', function () {
		for (var key in instance.elements) {
			instance.unsetElement(key);
		}
		var count = 0;
		for (var key in instance.elements) {
			if (instance.elements.hasOwnProperty(key)) { count++; }
		}
		expect(count).toEqual(0);
	});
});
