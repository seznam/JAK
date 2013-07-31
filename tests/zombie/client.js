var ZombieReporter = function() {
	this._passed = 0;
	this._failed = 0;

	var scripts = document.querySelectorAll("script");
	var last = scripts[scripts.length-1];
	this._reportUrl = last.src.split("/").slice(0, -1).join("/") + "/report";
}

ZombieReporter.prototype.jasmineDone = function() {
	var data = [];
	data.push("passed=" + this._passed);
	data.push("failed=" + this._failed);

	var script = document.createElement("script");
	script.src = this._reportUrl + "?" + data.join("&") + "&" + Math.random();
	document.body.appendChild(script);
}

ZombieReporter.prototype.specDone = function(spec) {
	switch (spec.status) {
		case "failed":
			this._failed++;
		break;

		case "passed":
			this._passed++;
		break;
	}
}

ZombieReporter.prototype.jasmineStarted = function() {}
ZombieReporter.prototype.suiteStarted = function() {}
ZombieReporter.prototype.suiteDone = function() {}
ZombieReporter.prototype.specStarted = function() {}

ZombieReporter.prototype.reportRunnerResults = ZombieReporter.prototype.jasmineDone;
ZombieReporter.prototype.reportSpecResults = function(spec) {
	var s = {status: spec.results().failedCount > 0 ? "failed" : "passed"};
	return this.specDone(s);
}

jasmine.getEnv().addReporter(new ZombieReporter());
