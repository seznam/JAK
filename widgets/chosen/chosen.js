// Chosen, a Select Box Enhancer for jQuery and Protoype
// by Patrick Filler for Harvest, http://getharvest.com
//
// Version 0.9.12
// Full source at https://github.com/harvesthq/chosen
// Copyright (c) 2011 Harvest http://getharvest.com

/**
 * @class Třída JAK.ChosenSelectParser
 */
JAK.ChosenSelectParser = JAK.ClassMaker.makeClass({
	NAME: "JAK.ChosenSelectParser",
	VERSION: "1.0"
});

/**
 * @param {HTMLElement} select
 *
 * @returns {object[]}
 */
JAK.ChosenSelectParser.select_to_array = function(select) {
	var parser = new JAK.ChosenSelectParser();

	for (var i = 0; i < select.childNodes.length; i++) { parser.add_node(select.childNodes[i]); }

	return parser.parsed;
}

JAK.ChosenSelectParser.prototype.$constructor = function(){
	this.options_index = 0;
	this.parsed = [];
}

/**
 * @param {Node} child
 */
JAK.ChosenSelectParser.prototype.add_node = function(child) {
	if (child.nodeName.toUpperCase() === "OPTGROUP") { this.add_group(child); }
	else { this.add_option(child); }
}

/**
* @param {HTMLElement} group
*/
JAK.ChosenSelectParser.prototype.add_group = function(group) {
	var group_position, option;
	group_position = this.parsed.length;
	this.parsed.push({array_index: group_position, group: true, label: group.label, children: 0, disabled: group.disabled});

	for (var i = 0; i < group.childNodes.length; i++) { this.add_option(option = group.childNodes[i], group_position, group.disabled); }
}

/**
* @param {Node} option
* @param {Int} group_position
* @param {Boolean} group_disabled
*/
JAK.ChosenSelectParser.prototype.add_option = function(option, group_position, group_disabled) {
	if (option.nodeName.toUpperCase() === "OPTION") {
		if (option.text != "") {
			if (group_position != null) { this.parsed[group_position].children += 1; }

			this.parsed.push({
				array_index: this.parsed.length,
				options_index: this.options_index,
				value: option.value,
				text: option.text,
				html: option.innerHTML,
				selected: option.selected,
				disabled: group_disabled === true ? group_disabled : option.disabled,
				group_array_index: group_position,
				classes: option.className,
				style: option.style.cssText,
				reference: option
			});
		} else {
			this.parsed.push({array_index: this.parsed.length, options_index: this.options_index, empty: true});
		}

		this.options_index += 1;
	}
}

/**
* Copyright (c) 2011 by Harvest
* @class Třída JAK.AbstractChosen
*/
JAK.AbstractChosen = JAK.ClassMaker.makeClass({
	NAME: "JAK.AbstractChosen",
	VERSION: "1.0"
});

JAK.AbstractChosen.SELECT_SOME_OPTIONS = "Vyberte některé položky";
JAK.AbstractChosen.SELECT_AN_OPTIONS = "Vyberte jednu z možností";
JAK.AbstractChosen.NO_RESULTS_MATCH = "Nenalezeno: ";

/**
* @param {HTMLElement} form_field
* @param {Object} options
*/
JAK.AbstractChosen.prototype.$constructor = function(form_field, options){
	this.choices = 0;
	this.form_field = form_field;
	this.options = options || {};
	this.is_multiple = this.form_field.multiple;
	this.active_field = false;
	this.mouse_on_container = false;
	this.results_showing = false;
	this.result_highlighted = null;
	this.result_single_selected = null;
	this.allow_single_deselect = (this.options.allow_single_deselect != null) && (this.form_field.options[0] != null) && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
	this.disable_search_threshold = this.options.disable_search_threshold || 0;
	this.disable_search = this.options.disable_search || false;
	this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
	this.search_contains = this.options.search_contains || false;
	this.single_backstroke_delete = this.options.single_backstroke_delete || false;
	this.inherit_select_classes = this.options.inherit_select_classes || false;

	this.set_default_text();
	this.set_default_values();
	this.setup();
	this.set_up_html();
	this.register_observers();
	this.finish_setup();

	this.liNoResult = this.search_results.appendChild(JAK.mel("li", {innerHTML: this.results_none_found +  " <span></span></li>", className: "no-results"}));
	this.liNoResult.style.display = "none";
}

/**
* @param {Event}
*/
JAK.AbstractChosen.prototype.click_test_action = function(e) {
	this.test_active_click(e);
}

/**
* @param {Event}
*/
JAK.AbstractChosen.prototype.activate_action = function(e) {
	this.activate_field(e);
}

JAK.AbstractChosen.prototype.set_default_text = function() {
	if (this.form_field.getAttribute("data-placeholder")) {	this.default_text = this.form_field.getAttribute("data-placeholder"); }
	else if (this.is_multiple) { this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || JAK.AbstractChosen.SELECT_SOME_OPTIONS; }
	else { this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || JAK.AbstractChosen.SELECT_AN_OPTIONS; }

	this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || JAK.AbstractChosen.NO_RESULTS_MATCH;
}

JAK.AbstractChosen.prototype.mouse_enter = function() {
	this.mouse_on_container = true;
}

JAK.AbstractChosen.prototype.mouse_leave = function() {
	this.mouse_on_container = false;
}

/**
* @param {Event} evt
*/
JAK.AbstractChosen.prototype.input_focus = function(evt) {
	var _this = this;

	if (this.is_multiple && !this.active_field) { setTimeout((function() { _this.container_mousedown(); }), 50); }
	if (!this.is_multiple && !this.active_field) { this.activate_field(); };
}

/**
* @param {Event} evt
*/
JAK.AbstractChosen.prototype.input_blur = function(evt) {
	var _this = this;

	if (!this.mouse_on_container) {
		this.active_field = false;

		setTimeout((function() { _this.blur_test(); }), 100);
	}
}

/**
* @param {Object}
*
* @returns {String}
*/
JAK.AbstractChosen.prototype.result_add_option = function(option) {
	if (!option.disabled) {
		option.dom_id = this.container_id + "_o_" + option.array_index;
		var classes = option.selected && this.is_multiple ? [] : ["active-result"];

		if (option.selected) { classes.push("result-selected"); }
		if (option.group_array_index != null) {	classes.push("group-option"); }
		if (option.classes !== "") { classes.push(option.classes); }

		var style = option.style.cssText !== "" ? " style=\"" + option.style + "\"" : "";

		return "<li id='" + option.dom_id + "' class='" + classes.join(" ") + "'" + style + ">" + option.html + "</li>";
	} else {
		return "";
	}
}

JAK.AbstractChosen.prototype.results_update_field = function() {
	this.set_default_text();

	if (!this.is_multiple) { this.results_reset_cleanup(); }

	this.result_clear_highlight();
	this.result_single_selected = null;
	this.results_build();
}

JAK.AbstractChosen.prototype.results_toggle = function() {
	if (this.results_showing) { this.results_hide(); }
	else { this.results_show(); }
}

JAK.AbstractChosen.prototype.results_search = function(evt) {
	if (this.results_showing) { this.winnow_results(); }
	else { this.results_show(); }
}

/**
* @param {Event} evt
*/
JAK.AbstractChosen.prototype.keyup_checker = function(evt) {
	this.search_field_scale();

	switch (evt.keyCode) {
		case 8:
			if (this.is_multiple && this.backstroke_length < 1 && this.choices > 0) {
				this.keydown_backstroke();
			} else if (!this.pending_backstroke) {
				this.result_clear_highlight();
				this.results_search();
			}
			break;
		case 13:
			JAK.Events.cancelDef(evt);

			if (this.results_showing) { this.result_select(evt); }

			break;
		case 27:
			if (this.results_showing) { this.results_hide(); }

			break
		case 9:
		case 38:
		case 40:
		case 16:
		case 91:
		case 17:
			break;
		default:
			this.results_search();
	}
}

/**
 * @class Třída JAK.Chosen
 * @signal chzn:showing_dropdown vysledky byly zobrazeny
 * @signal chzn:hiding_dropdown vysledky byly schovany
 */
JAK.Chosen = JAK.ClassMaker.makeClass({
	NAME: "JAK.Chosen",
	VERSION: "1.0",
	EXTEND: JAK.AbstractChosen,
	IMPLEMENT: JAK.ISignals
});

/**
* @param {HTMLElement} select
* @param {Object} options
*/
JAK.Chosen.prototype.$constructor = function(select, options){
	this._events = {};
	this.$super(select, options);
}

/**
* @returns {Int}
*/
JAK.Chosen.prototype.getContainerHeight = function(){
	return this.container.offsetHeight;
}

/**
* @returns {Boolean}
*/
JAK.Chosen.prototype.setup = function() {
	this.current_value = this.form_field.value;

	return this.is_rtl = JAK.DOM.hasClass(this.form_field, "chzn-rtl");
}

/**
* @returns {HTMLElement}
*/
JAK.Chosen.prototype.finish_setup = function() {
	this.form_field.classList.add("chzn-done");

	return this.form_field;
}

JAK.Chosen.prototype.set_default_values = function() {
	this.single_temp = '<a href="javascript:void(0)" class="chzn-single chzn-default" tabindex="-1"><span>' + this.default_text + '</span><div><b></b></div></a><div class="chzn-drop" style="left:-9000px;"><div class="chzn-search"><input type="text" autocomplete="off" /></div><ul class="chzn-results"></ul></div>';
	this.multi_temp = '<ul class="chzn-choices"><li class="search-field"><input type="text" value="' + this.default_text + '" class="default" autocomplete="off" style="width:25px;" /></li></ul><div class="chzn-drop" style="left:-9000px;"><ul class="chzn-results"></ul></div>';
	this.choice_temp =  '<li class="search-choice" id="#{id}"><span>#{choice}</span><a href="javascript:void(0)" class="search-choice-close" rel="#{position}"></a></li>';
	this.choice_noclose_temp = '<li class="search-choice search-choice-disabled" id="#{id}"><span>#{choice}</span></li>';
}

JAK.Chosen.prototype.set_up_html = function() {
	var elmm, container_classes, dd_top, dd_width, sf_width;
	this.container_id = (this.form_field.id || JAK.idGenerator()).replace(/[^\w]/g, "_") + "_chzn";
	container_classes = ["chzn-container"];
	container_classes.push("chzn-container-" + (this.is_multiple ? "multi" : "single"));

	if (this.inherit_select_classes && this.form_field.className) { container_classes.push(this.form_field.className); }
	if (this.is_rtl) { container_classes.push("chzn-rtl"); }

	this.f_width = this.form_field.offsetWidth;
	elmm = JAK.mel("div", {
		id: this.container_id,
		className: container_classes.join(' '),
		title: this.form_field.title,
		innerHTML: (this.is_multiple ? this.multi_temp : this.single_temp)
	});
	elmm.style.width = this.f_width + "px";

	this.form_field.parentNode.insertBefore(elmm, this.form_field.nextSibling);
	this.form_field.style.display = "none";

	this.container = elmm;
	this.dropdown = this.container.querySelector("div.chzn-drop");

	dd_top = this.container.offsetHeight;
	dd_width = this.f_width - this.getSideBorders(this.dropdown);
	JAK.DOM.setStyle(this.dropdown, {width: dd_width + "px", top: dd_top + "px"});
	this.search_field = this.container.querySelector("input");
	this.search_results = this.container.querySelector("ul.chzn-results");
	this.search_field_scale();
	this.search_no_results = this.container.querySelector("li.no-results");

	if (this.is_multiple) {
		this.search_choices = this.container.querySelector("ul.chzn-choices");
		this.search_container = this.container.querySelector("li.search-field");
	} else {
		this.search_container = this.container.querySelector("div.chzn-search");
		this.selected_item = this.container.querySelector(".chzn-single");
		sf_width = dd_width - this.getSideBorders(this.search_container) - this.getSideBorders(this.search_field);
		JAK.DOM.setStyle(this.search_field, {width: sf_width + "px"});
	}

	this.results_build();
	this.set_tab_index();
}

JAK.Chosen.prototype.register_observers = function() {
	JAK.Events.addListener(this.container, "mousedown", this, this.container_mousedown);
	JAK.Events.addListener(this.container, "mouseup", this, this.container_mouseup);
	JAK.Events.addListener(this.container, "mouseover", this, this.mouse_enter);
	JAK.Events.addListener(this.container, "mouseleave", this, this.mouse_leave);
	JAK.Events.addListener(this.search_results, "mouseup", this, this.search_results_mouseup);
	JAK.Events.addListener(this.search_results, "mouseover", this, this.search_results_mouseover);
	JAK.Events.addListener(this.search_results, "mouseout", this, this.search_results_mouseout);
	JAK.Events.addListener(this.search_field, "blur", this, this.input_blur);
	JAK.Events.addListener(this.search_field, "keyup", this, this.keyup_checker);
	JAK.Events.addListener(this.search_field, "keydown", this, this.keydown_checker);
	JAK.Events.addListener(this.search_field, "focus", this, this.input_focus);

	if (this.is_multiple) { JAK.Events.addListener(this.search_choices, "click", this, this.choices_click); }
	else { JAK.Events.addListener(this.container, "click", this, JAK.Events.cancelDef); }
}

JAK.Chosen.prototype.search_field_disabled = function() {
	this.is_disabled = this.form_field.disabled;

	if (this.is_disabled) {
		this.container.classList.add("chzn-disabled");
		this.search_field.disabled = true;
		this.close_field();
	} else {
		this.container.classList.remove("chzn-disabled");
		this.search_field.disabled = false;

		if (!this.is_multiple) { this._events.activate_action = JAK.Events.addListener(this.selected_item, "focus", this, "activate_action"); }
	}
}

/**
* @param {Event}
*/
JAK.Chosen.prototype.container_mousedown = function(evt) {
	if (!this.is_disabled) {
		var target_closelink = evt != null ? JAK.DOM.hasClass(JAK.Events.getTarget(evt), "search-choice-close") : false;
		this.liNoResult.style.display = "none";

		if (evt && evt.type === "mousedown" && !this.results_showing) {	JAK.Events.stopEvent(evt); }
		if (!this.pending_destroy_click && !target_closelink) {
			if (!this.active_field) {
				this.results_open();
			} else if (!this.is_multiple && evt && (JAK.Events.getTarget(evt) === this.selected_item || this.searchInParents(JAK.Events.getTarget(evt), "chzn-single"))) {
				this.results_toggle();
			}

			this.activate_field();
		} else {
			this.pending_destroy_click = false;
		}
	}
}

/**
* @param {Event}
*/
JAK.Chosen.prototype.container_mouseup = function(evt) {
	if (JAK.Events.getTarget(evt).nodeName === "ABBR" && !this.is_disabled) { this.results_reset(evt); }
}

JAK.Chosen.prototype.blur_test = function() {
	if (!this.active_field && JAK.DOM.hasClass(this.container, "chzn-container-active")) { this.close_field(); }
}

JAK.Chosen.prototype.close_field = function() {
	this.active_field = false;
	this.results_hide();
	this.container.classList.remove("chzn-container-active");
	this.winnow_results_clear();
	this.clear_backstroke();
	this.show_search_field_default();
	this.search_field_scale();
}

JAK.Chosen.prototype.activate_field = function() {
	this.container.classList.add("chzn-container-active");
	this.active_field = true;


	this.search_field.focus();
}

/**
* @param {Event} e
*/
JAK.Chosen.prototype.test_active_click = function(e) {
	if (this.searchInParents(JAK.Events.getTarget(e), null, this.container_id)) { this.active_field = true; }
	else { this.close_field(); }
}

JAK.Chosen.prototype.results_build = function() {
	var content, data, selectedItem, choicesElms;

	this.parsing = true;
	this.results_data = JAK.ChosenSelectParser.select_to_array(this.form_field);

	if (this.is_multiple && this.choices > 0) {
		choicesElms = this.search_choices.querySelectorAll("li.search-choice");

		for (var i = 0; i < choicesElms.length; i++) { choicesElms[i].parentNode.removeChild(choicesElms[i]); }

		this.choices = 0;
	} else if (!this.is_multiple) {
		this.selected_item.classList.add("chzn-default");
		selectedItem = this.selected_item.querySelector("span");
		selectedItem.innerHTML = this.default_text;

		if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold) {
			this.container.classList.add("chzn-container-single-nosearch");
		} else {
			this.container.classList.remove("chzn-container-single-nosearch");
		}
	}

	content = "";

	for (var i = 0; i < this.results_data.length; i++) {
		data = this.results_data[i];

		if (data.group) {
			content += this.result_add_group(data);
		} else if (!data.empty) {
			content += this.result_add_option(data);
			if (data.selected && this.is_multiple) {
				this.choice_build(data);
			} else if (data.selected && !this.is_multiple) {
				this.selected_item.classList.remove("chzn-default");
				selectedItem = this.selected_item.querySelector("span");
				selectedItem.innerHTML = data.html;

				if (this.allow_single_deselect) { this.single_deselect_control_build(); }
			}
		}
	}

	this.search_field_disabled();
	this.show_search_field_default();
	this.search_field_scale();
	this.search_results.innerHTML = content;
	this.parsing = false;
}

/**
* @param {Object}
*
* @returns {String}
*/
JAK.Chosen.prototype.result_add_group = function(group) {
	if (!group.disabled) {
		group.dom_id = this.container_id + "_g_" + group.array_index;

		return '<li id="' + group.dom_id + '" style="display: list-item;" class="group-result">' + group.label + '</li>';
	} else {
		return "";
	}
}

/**
* @returns {HTMLElement}
*/
JAK.Chosen.prototype.result_do_highlight = function(el) {
	var high_bottom, high_top, maxHeight, visible_bottom, visible_top;
	this.result_clear_highlight();
	this.result_highlight = el;
	this.result_highlight.classList.add("highlighted");
	maxHeight = parseInt(JAK.DOM.getStyle(this.search_results, "maxHeight"), 10);
	visible_top = this.search_results.scrollTop;
	visible_bottom = maxHeight + visible_top;
	high_top = JAK.DOM.getBoxPosition(this.result_highlight, this.result_highlight.parentNode).top;
	high_bottom = high_top + this.result_highlight.offsetHeight;

	if (high_bottom >= visible_bottom) { return this.search_results.scrollTop = (high_bottom - maxHeight) > 0 ? high_bottom - maxHeight : 0; }
	else if (high_top < visible_top) { return this.search_results.scrollTop = high_top; }
}

JAK.Chosen.prototype.result_clear_highlight = function() {
	if (this.result_highlight) { this.result_highlight.classList.remove("highlighted"); };

	this.result_highlight = null;
}

/**
* Otevře výsledky
*/
JAK.Chosen.prototype.results_open = function() {
	if (this.is_multiple) {	this.search_field.value = ""; }

	this._events.click_test_action = JAK.Events.addListener(document, "click", this, "click_test_action");
	this.results_show();
}

JAK.Chosen.prototype.results_show = function() {
	if (!this.is_multiple) {
		this.selected_item.classList.add("chzn-single-with-drop");

		if (this.result_single_selected) { this.result_do_highlight(this.result_single_selected); }
	}

	var dd_top = this.is_multiple ? this.getContainerHeight() : this.getContainerHeight() - 1;

	this.makeEvent("liszt:showing_dropdown", {chosen: this});
	JAK.DOM.setStyle(this.dropdown, {top: dd_top + "px", left: 0});
	this.results_showing = true;
	this.search_field.focus();
	this.search_field.value = this.search_field.value;
}

JAK.Chosen.prototype.results_hide = function() {
	if (!this.is_multiple) { this.selected_item.classList.remove("chzn-single-with-drop"); }

	this.search_field.value = "";
	this.winnow_results();
	this.result_clear_highlight();
	this.makeEvent("liszt:hiding_dropdown", {chosen: this});
	JAK.DOM.setStyle(this.dropdown, {left: "-9000px"});
	this.results_showing = false;
}

JAK.Chosen.prototype.set_tab_index = function() {
	if (this.form_field.tabIndex) {
		var ti = this.form_field.tabIndex;
		this.form_field.tabIndex = -1;
		this.search_field.tabIndex = ti;
	}
}

JAK.Chosen.prototype.show_search_field_default = function() {
	if (this.is_multiple && this.choices < 1 && !this.active_field) {
		this.search_field.value = this.default_text;
		this.search_field.classList.add("default");
	} else {
		this.search_field.value = "";
		this.search_field.classList.remove("default");
	}
}

/**
* @param {Event} e
*/
JAK.Chosen.prototype.search_results_mouseup = function(e) {
	var srcElement = JAK.Events.getTarget(e);
	var target = JAK.DOM.hasClass(srcElement, "active-result") ? srcElement : this.searchInParents(srcElement, "active-result");

	if (target) {
		this.result_highlight = target;
		this.result_select(e);
		this.search_field.focus();
	}
}

/**
* @param {Event} e
*/
JAK.Chosen.prototype.search_results_mouseover = function(e) {
	var srcElement = JAK.Events.getTarget(e);
	var target = JAK.DOM.hasClass(srcElement, "active-result") ? srcElement : this.searchInParents(srcElement, "active-result");

	if (target) { this.result_do_highlight(target); }
}

/**
* @param {Event} e
*/
JAK.Chosen.prototype.search_results_mouseout = function(e) {
	if (this.searchInParents(JAK.Events.getTarget(e), "active-result")) { this.result_clear_highlight(); }
}

/**
* @param {Event} e
*/
JAK.Chosen.prototype.choices_click = function(e) {
	JAK.Events.cancelDef(e);
	var srcElement = JAK.Events.getTarget(e);

	if (this.active_field && !(JAK.DOM.hasClass(srcElement, "search-choice") || this.searchInParents(srcElement, "search-choice")) && !this.results_showing) {
		this.results_show();
	}
}

/**
* @param {Object} item
*/
JAK.Chosen.prototype.choice_build = function(item) {
	var choice_id, link, template, elm;

	choice_id = this.container_id + "_c_" + item.array_index;
	this.choices += 1;
	template = (item.disabled ? this.choice_noclose_temp : this.choice_temp);
	elm = this.replaceIH(template, {id: choice_id, choice: item.html, position: item.array_index});
	link = elm.querySelector("a");
	this.search_container.parentNode.insertBefore(elm, this.search_container);

	if (!item.disabled) { JAK.Events.addListener(link, "click", this, "choice_destroy_link_click"); }
}

/**
* @param {Event} e
*/
JAK.Chosen.prototype.choice_destroy_link_click = function(e) {
	JAK.Events.cancelDef(e);

	if (!this.is_disabled) {
		this.pending_destroy_click = true;
		this.choice_destroy(JAK.Events.getTarget(e));
	}
}

/**
* @param {HTMLElement}
*/
JAK.Chosen.prototype.choice_destroy = function(link) {
	if (this.result_deselect(link.getAttribute("rel"))) {
		this.choices -= 1;
		this.show_search_field_default();

		if (this.is_multiple && this.choices > 0 && this.search_field.value.length < 1) { this.results_hide(); }

		link.parentNode.parentNode.removeChild(link.parentNode);
		this.search_field_scale();
		this.makeEvent("liszt:choice_was_removed", {chosen: this});
	}
}

JAK.Chosen.prototype.results_reset = function() {
	this.form_field.options[0].selected = true;
	var span = this.selected_item.querySelector("span");
	JAK.DOM.clear(span);
	span.appendChild(this.default_text);

	if (!this.is_multiple) { this.selected_item.classList.add("chzn-default"); }

	this.show_search_field_default();
	this.results_reset_cleanup();

	if (this.active_field) { this.results_hide(); }
}

JAK.Chosen.prototype.results_reset_cleanup = function() {
	this.current_value = this.form_field.value;
	var deselect_trigger = this.selected_item.querySelector("abbr");

	if (deselect_trigger) { deselect_trigger.parentNode.removeChild(deselect_trigger); }
}

/**
* @param {Event} e
*/
JAK.Chosen.prototype.result_select = function(e) {
	var high, item, position, selectedItem, selected;

	if (this.result_highlight) {
		high = this.result_highlight;
		this.result_clear_highlight();

		if (this.is_multiple) {
			this.result_deactivate(high);
		} else {
			var selected = this.search_results.querySelectorAll(".result-selected");

			for (var i = 0; i < selected.length; i++) { selected[i].classList.remove("result-selected"); }

			this.selected_item.classList.remove("chzn-default");
			this.result_single_selected = high;
		}

		high.classList.add("result-selected");
		position = high.id.substr(high.id.lastIndexOf("_") + 1);
		item = this.results_data[position];
		item.selected = true;
		this.form_field.options[item.options_index].selected = true;

		if (this.is_multiple) {
			this.choice_build(item);
		} else {
			selectedItem = this.selected_item.querySelector("span");
			selectedItem.innerHTML = item.html;

			if (this.allow_single_deselect) { this.single_deselect_control_build(); }
		}
		if (!((e.metaKey || e.ctrlKey) && this.is_multiple)) { this.results_hide();	}

		this.search_field.value = "";
		this.current_value = this.form_field.value;
		this.search_field_scale();
	}

	this.makeEvent("liszt:selected", {chosen: this});
}

/**
* @param {HTMLElement} elm
*
* @returns {HTMLElement}
*/
JAK.Chosen.prototype.result_activate = function(elm) {
	if (elm) { elm.classList.add("active-result"); };

	return elm;
}

/**
* @param {HTMLElement} elm
*
* @returns {HTMLElement}
*/
JAK.Chosen.prototype.result_deactivate = function(elm) {
	elm.classList.remove("active-result");

	return elm;
}

/**
* @param {Int} pos
*
* @returns {Boolean}
*/
JAK.Chosen.prototype.result_deselect = function(pos) {
	var result_data = this.results_data[pos];

	if (!this.form_field.options[result_data.options_index].disabled) {
		result_data.selected = false;
		this.form_field.options[result_data.options_index].selected = false;
		var result = JAK.gel(this.container_id + "_o_" + pos);
		result.classList.remove("result-selected");
		result.classList.add("active-result");
		this.result_clear_highlight();
		this.winnow_results();
		this.search_field_scale();

		return true;
	} else {
		return false;
	}
}

JAK.Chosen.prototype.single_deselect_control_build = function() {
	if (this.allow_single_deselect && !this.selected_item.querySelector("abbr")) {
		this.selected_item.querySelector("span").appendChild(JAK.mel("abbr", {className: "search-choice-close"}));
	}
}

JAK.Chosen.prototype.winnow_results = function() {
	var found, option, part, parts, regex, regexAnchor, result_id, results, searchText, startpos, text, zregex, resultElm, elm;

	results = 0;
	searchText = this.search_field.value === this.default_text ? "" : this.search_field.value.trim();
	regexAnchor = this.search_contains ? "" : "^";
	regex = new RegExp(regexAnchor + searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
	zregex = new RegExp(searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");

	if (!this.is_disabled) { this.liNoResult.style.display = "none"; }

	for (var i = 0; i < this.results_data.length; i++) {
		option = this.results_data[i];

		if (!option.disabled && !option.empty) {
			if (option.group) {
				JAK.DOM.setStyle(JAK.gel(option.dom_id), {display: "none"});
			} else if (!(this.is_multiple && option.selected)) {
				found = false;
				result_id = option.dom_id;

				if (regex.test(option.html)) {
					found = true;
					results += 1;
				} else if (this.enable_split_word_search && (option.html.indexOf(" ") >= 0 || option.html.indexOf("[") === 0)) {
					parts = option.html.replace(/\[|\]/g, "").split(" ");

					if (parts.length) {
						for (var j = 0; j < parts.length; j++) {
							part = parts[j];

							if (regex.test(part)) {
								found = true;
								results += 1;
							}
						}
					}
				}
				if (found) {
					if (searchText.length) {
						startpos = option.html.search(zregex);
			                	text = option.html.substr(0, startpos + searchText.length) + "</em>" + option.html.substr(startpos + searchText.length);
			                	text = text.substr(0, startpos) + "<em>" + text.substr(startpos);
					}
					else {
						text = option.html;
					}
					var elm = JAK.gel(result_id);
					if (elm && elm.innerHTML !== text) {
						resultElm = JAK.gel(result_id);
						JAK.DOM.clear(resultElm);
						resultElm.appendChild(JAK.mel("span", {innerHTML: text}));
					}

					if (!this.is_disabled) { this.result_activate(JAK.gel(result_id)); }

					if (option.group_array_index != null) {	JAK.DOM.setStyle(JAK.gel(this.results_data[option.group_array_index].dom_id), {display: "list-item"}); }
				} else {
					if (JAK.gel(result_id) === this.result_highlight) { this.result_clear_highlight(); }

					this.result_deactivate(JAK.gel(result_id));
				}
			}
		}
	}

	if (results < 1 && searchText.length) { this.no_results(searchText); }
	else { this.winnow_results_set_highlight(); }
}

JAK.Chosen.prototype.winnow_results_clear = function() {
	var li, lis, results = [];

	this.search_field.value = "";
	lis = this.search_results.querySelectorAll("li");

	for (var i = 0; i < lis.length; i++) {
		li = lis[i];

		if (JAK.DOM.hasClass(li, "group-result")) { li.style.display = "list-item"; }
		else if (!this.is_multiple || !JAK.DOM.hasClass(li, "result-selected")) { this.result_activate(li); }
	}
}

JAK.Chosen.prototype.winnow_results_set_highlight = function() {
	var do_high;

	if (!this.result_highlight) {
		if (!this.is_multiple) { do_high = this.search_results.querySelector(".result-selected.active-result"); }
		if (!(do_high != null)) { do_high = this.search_results.querySelector(".active-result"); }
		if (do_high != null) { this.result_do_highlight(do_high); }
	}
}

/**
* @params {String} terms
*/
JAK.Chosen.prototype.no_results = function(terms) {
	this.liNoResult.style.display = "list-item";
	this.liNoResult.lastChild.innerHTML = terms;
}

JAK.Chosen.prototype.keydown_arrow = function() {
	var actives = this.search_results.querySelectorAll("li.active-result");

	if (actives.length) {
		if (!this.result_highlight) {
			this.result_do_highlight(actives[0]);
		} else if (this.results_showing) {
			var next = this.getSibling(actives, this.result_highlight, "next");

			if (next) { this.result_do_highlight(next); }
		}
		if (!this.results_showing) { this.results_show(); }
	}
}

JAK.Chosen.prototype.keyup_arrow = function() {
	if (!this.results_showing && !this.is_multiple) {
		this.results_show();
	} else if (this.result_highlight) {
		var actives = this.search_results.querySelectorAll("li.active-result");
		var prevs = this.getSibling(actives, this.result_highlight, "previous")

		if (prevs) {
			this.result_do_highlight(prevs);
		} else {
			if (this.choices > 0) {	this.results_hide(); }

			this.result_clear_highlight();
		}
	}
}

JAK.Chosen.prototype.keydown_backstroke = function() {
	var next_available_destroy;

	if (this.pending_backstroke) {
		this.choice_destroy(this.pending_backstroke.querySelector("a"));
		this.clear_backstroke();
	} else {
		next_available_destroy = this.search_container.parentNode.lastChild.previousSibling;

		if (next_available_destroy && JAK.DOM.hasClass(next_available_destroy, "search-choice") && !JAK.DOM.hasClass(next_available_destroy, "search-choice-disabled")) {
			this.pending_backstroke = next_available_destroy;

			if (this.pending_backstroke) { this.pending_backstroke.classList.add("search-choice-focus"); }
			if (this.single_backstroke_delete) { this.keydown_backstroke(); }
			else { this.pending_backstroke.classList.add("search-choice-focus"); }
		}
	}
}

JAK.Chosen.prototype.clear_backstroke = function() {
	if (this.pending_backstroke) { this.pending_backstroke.classList.remove("search-choice-focus"); }

	this.pending_backstroke = null;
}

/**
* @param {Event} evt
*/
JAK.Chosen.prototype.keydown_checker = function(evt) {
	var stroke = (evt.which) != null ? evt.which : evt.keyCode;
	this.search_field_scale();

	if (stroke !== 8 && this.pending_backstroke) { this.clear_backstroke(); }
	switch (stroke) {
		case 8:
			this.backstroke_length = this.search_field.value.length;
			break;
		case 9:
			if (this.results_showing && !this.is_multiple) { this.result_select(evt); }

			this.mouse_on_container = false;
			break;
		case 13:
			JAK.Events.cancelDef(evt);
			break;
		case 38:
			JAK.Events.cancelDef(evt);
			this.keyup_arrow();
			break;
		case 40:
			this.keydown_arrow();
			break;
	}
}

JAK.Chosen.prototype.search_field_scale = function() {
	if (this.is_multiple) {
		var width = this.stringWidth(this.search_field.value);

		if (width > this.f_width - 10) { width = this.f_width - 10; }

		JAK.DOM.setStyle(this.search_field, {width: width + "px"});
		JAK.DOM.setStyle(this.dropdown, {top: this.container.offsetHeight + "px"});
	}
}

/**
* @param {String} str
*
* @returns {Int}
*/
JAK.Chosen.prototype.stringWidth = function(str){
	var style_block = {position: "absolute", left: "-1000px", top: "-1000px"};
	var styles = ["font-size", "font-style", "font-weight", "font-family", "line-height", "text-transform", "letter-spacing"];
	var width = 0;

	for (var i = 0; i < styles.length; i++) { style_block[styles[i]] = JAK.DOM.getStyle(this.search_field, styles[i]); }

	div = JAK.mel("div", {innerHTML: str});
	document.body.appendChild(div);
	JAK.DOM.setStyle(div, style_block);
	width = div.offsetWidth + 25;
	div.parentNode.removeChild(div);

	return width;
}

/**
* @param {HTMLElement} elm
*/
JAK.Chosen.prototype.getSideBorders = function(elm) {
	var prop = ["borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"];
	var side_border_padding = 0;

	for (var i = 0; i < prop.length; i++) { side_border_padding += parseInt(JAK.DOM.getStyle(elm, prop[i]), 10) || 0; }

	return side_border_padding;
}

/* nelze nahradit jakem */
/**
* prohledava parentElmy a porovnava jejich idcka NEBO classy
* @param {Object} elm
* @param {String} klass
* @param {String} id
*
* @returns {Object|Undefined}
*/
JAK.Chosen.prototype.searchInParents = function(elm, klass, id){
	var currentElm = elm;

	while(currentElm && currentElm != document){
		if (klass && JAK.DOM.hasClass(currentElm, klass)) { return currentElm; }
		if (id && currentElm.id == id) { return currentElm; }

		currentElm = currentElm.parentNode;
	}

}

/**
* @param {String} template
* @param {Object} properties
*
* @returns {Object}
*/
JAK.Chosen.prototype.replaceIH = function(template, properties){
	var docFrag = document.createDocumentFragment();
	var elm = JAK.mel("span");

	for (var key in properties) { template = template.replace("#{" + key + "}", properties[key], "gi"); }

	elm.innerHTML = template;

	for (var i = 0; i < elm.children.length; i++) { docFrag.appendChild(elm.children[i]); }

	return docFrag;
}

/**
* Vraci predchoziho nebo nasledujiciho sourozence, pouziva se v NodeListu kde nemusi byt nasledujici videt
* proto nejde pouzit NextSibling a PreviousSibling
*
* @param {NodeList} elms
* @param {HTMLElement} currentElm
* @param {String} direction
*
* @returns {HTMLElement|Undefined}
*/
JAK.Chosen.prototype.getSibling = function(elms, currentElm, direction){
	for (var i = 0; i < elms.length; i++) {
		if (elms[i] == currentElm) {
			if (direction == "next" && i < elms.length) { return elms[i + 1]; };
			if (direction == "previous" && i > 0) { return elms[i - 1]; };
		};
	}
}
