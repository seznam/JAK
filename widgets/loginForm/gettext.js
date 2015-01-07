var _ = function() {
	var key = arguments[0];
	var func = window.i18n_.loginForm[key];
	if (!func) { return key; }

	var args = [];
	for (var i=1;i<arguments.length;i++) { args.push(arguments[i]); }
	return func.apply(null, args);
}
