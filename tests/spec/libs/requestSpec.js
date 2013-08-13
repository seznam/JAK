describe("JAK.Request", function(){
	it("should GET a XML document", function() {
		var result = null;

		runs(function() {
			var r = new JAK.Request(JAK.Request.XML, {method:"get", async:true});
			r.setCallback(function(data) { result = data; });
			r.send("request/request.xml");
		});

		waitsFor(function() {
			return result;
		});

		runs(function() {
			expect(result.documentElement.tagName.toLowerCase()).toBe("test");
		});
	});

	it("should POST a TEXT document", function() {
		var result = null;

		runs(function() {
			if (window.location.protocol.match(/file/)) { alert("Nelze spustit s protokolem 'file:'"); }
			var r = new JAK.Request(JAK.Request.TEXT, {method:"post", async:true});
			r.setCallback(function(data) { result = data; });
			r.send("request/request.php", "a=b&c=d");
		});

		waitsFor(function() {
			return result;
		});

		runs(function() {
			expect(result).toBe("d");
		});
	});

	it("should GET a JSONP/JS document", function() {
		var result = null;

		runs(function() {
			var r = new JAK.Request(JAK.Request.JSONP, {method:"get", async:true});
			r.setCallback(function(data) { result = data; });

			var oldgen = JAK.idGenerator;
			JAK.idGenerator = function() { return "mock"; }
			r.send("request/request.js");
			JAK.idGenerator = oldgen;
		});

		waitsFor(function() {
			return result;
		});

		runs(function() {
			expect(result).toBe("test");
		});
	});

	it("should perform a synchronous GET", function() {
		var result = null;

		var r = new JAK.Request(JAK.Request.XML, {method:"get", async:false});
		r.setCallback(function(data) {result = data;});
		r.send("request/request.xml");

		expect(result.documentElement.tagName.toLowerCase()).toBe("test");
	});

	it("should perform a synchronous POST", function() {
		var result = null;

		if (window.location.protocol.match(/file/)) { alert("Nelze spustit s protokolem 'file:'"); }
		var r = new JAK.Request(JAK.Request.TEXT, {method:"post", async:false});
		r.setCallback(function(data) { result=data; });
		r.send("request/request.php", "a=b&c=d");

		expect(result).toBe("d");
	});

	it("should abort a timeouting request", function() {
		var aborted = false;
		var returned = false;

		runs(function() {
			var r = new JAK.Request(JAK.Request.TEXT);
			r.setCallback(function() {
				returned = true;
			});
			r.setAbortCallback(function() {
				aborted = true;
			});
			r.send("request5s.php?r="+Math.random());
			r.abort();
		});

		waitsFor(function() {
			return aborted;
		});

		runs(function() {
			expect(aborted).toBe(true);
			expect(returned).toBe(false);
		});
	});

	it("should perform a binary transfer", function() {
		var result = null;
		var r = new JAK.Request(JAK.Request.BINARY, {async:false});
		r.setCallback(function(data) { result = data; });
		r.send("request/test.png");

		expect(result.length).toBe(924);
		expect(result[0]).toBe(137);
	});
});
