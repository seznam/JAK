describe("JAS", function() {
	// helpers
	function createEvent(type) {
		var evt = document.createEvent("Event");
		evt.initEvent(type, true, true);
		return evt;
	}

	// mocks
	var TestDispatcher = JAK.ClassMaker.makeClass({
		NAME: "TestDispatcher",
		VERSION: "1.0",
		EXTEND: JAS.ADispatcher
	});

	TestDispatcher.prototype.getStateData = function(url) {
		if (url.indexOf("SpecRunner.html") > -1) {
			return {
				stateId: "default",
				params: {}
			};
		} else if (url == "/") {
			return {
				stateId: "home",
				params: {}
			};
		} else if (url.indexOf("/detail") == 0) {
			var parsed = JAS.ADispatcher.baseParseUrl(url);
			return {
				stateId: "detail",
				params: { id:parsed.path[1], show:parsed.qs.show ? parsed.qs.show : "" }
			};
		} else {
			return null;
		}
	};

	var TestState = JAK.ClassMaker.makeClass({
		NAME: "TestState",
		VERSION: "1.0",
		EXTEND: JAS.AState
	});

	TestState.prototype.$constructor = function(id) {
		this.$super();
		this._id = id;
		this.active = false;
		this.params = null;
	};

	TestState.prototype.activate = function(params) {
		this.active = true;
		this.params = params;
	};

	TestState.prototype.deactivate = function(newState) {
		this.active = false;
	};

	TestState.prototype.getUrl = function() {
		return "";
	};

	// instances
	var d = new TestDispatcher();
	var s0 = new TestState("default");
	var s1 = new TestState("home");
	var s2 = new TestState("detail");
	var s404 = new TestState("not-found");


	describe("general methods", function() {
		it("should parse query string", function() {
			var obj = JAS.Core.parseQs("param1=value%201&param2=a=b&param3=first&param3=second&param4=&param5&param6[]=value1&param6[]=value2&param7[first]=value1&param7[second]=value2");
			expect((typeof obj)).toEqual("object");
			expect(obj.param1).toEqual("value 1");
			expect(obj.param2).toEqual("a=b");
			expect(obj.param3).toEqual("second");
			expect(obj.param4).toEqual("");
			expect(obj.param5).toEqual("");
			expect((typeof obj.param6)).toEqual("object");
			expect(obj.param6[0]).toEqual("value1");
			expect(obj.param6[1]).toEqual("value2");
			expect((typeof obj.param7)).toEqual("object");
			expect(obj.param7["first"]).toEqual("value1");
			expect(obj.param7["second"]).toEqual("value2");
		});

		it("should serialize object to query string", function() {
			var obj = {
				param1: "value 1",
				param2: "a=b",
				param3: "first",
				param3: "second",
				param4: "",
				param5: null,
				param6: ["value1", "value2"],
				param7: { first:"value1", second:"value2" }
			};
			var qs = JAS.Core.makeQs(obj);
			expect(qs).toEqual("param1=value%201&param2=a%3Db&param3=second&param4=&param5&param6[]=value1&param6[]=value2&param7[first]=value1&param7[second]=value2");
		});

		describe("merging objects", function() {
			it("dummy merge objects", function() {
				var obj1 = {
					attr1: "value1",
					attr2: "value2",
				};
				var obj2 = {
					attr2: "value3",
					attr3: "value4",
				};
				var mo = JAS.Core.mergeObjects(obj1, obj2);
				expect(mo).toEqual({
					attr1: "value1",
					attr2: "value3",
					attr3: "value4"
				});
			});

			it("dummy merge two-level objects", function() {
				var obj1 = {
					lAa1: "lAv1",
					lAa2: { lBa1:"lBv1", lBa2:"lBv2" }
				};
				var obj2 = {
					lAa2: { lBa2:"lBv3", lBa3:"lBv4" },
					lAa3: "lAv2"
				};
				var mo = JAS.Core.mergeObjects(obj1, obj2);
				expect(mo).toEqual({
					lAa1: "lAv1",
					lAa2: { lBa2:"lBv3", lBa3:"lBv4" },
					lAa3: "lAv2"
				});
			});

			it("deep merge two-level objects", function() {
				var obj1 = {
					lAa1: "lAv1",
					lAa2: { lBa1:"lBv1", lBa2:"lBv2" },
					lAa3: ["lA_v0", "1A_v1"]

				};
				var obj2 = {
					lAa2: { lBa2:"lBv3", lBa3:"lBv4" },
					lAa3: ["lA_v2", "1A_v3", "1A_v4"],
					lAa4: "lAv6"
				};
				var mo = JAS.Core.mergeObjects(obj1, obj2, true);
				expect(mo).toEqual({
					lAa1: "lAv1",
					lAa2: { lBa1:"lBv1", lBa2:"lBv3", lBa3:"lBv4" },
					lAa3: ["lA_v2", "1A_v3", "1A_v4"],
					lAa4: "lAv6"
				});
			});

			it("deep merge four-level objects", function() {
				var obj1 = {
					lAa1: { lBa1:"lBv1", lBa2: { lCa1:"lCv1", lCa2:{}, lCa3: { lDa1:"KO!" } } }

				};
				var obj2 = {
					lAa1: { lBa2: { lCa1:"lCv2", lCa2:null, lCa3: { lDa1:"OK :)" }  }, lBa3:"lBv2" }
				};
				var mo = JAS.Core.mergeObjects(obj1, obj2, true);
				expect(mo).toEqual({
					lAa1: { lBa1:"lBv1", lBa2: { lCa1:"lCv2", lCa2:null, lCa3: { lDa1:"OK :)" } }, lBa3:"lBv2" },
				});
			});
		});
	});

	describe("main methods", function() {
		it("should configure the Core", function() {
			JAS.Core.getInstance().init({
				dispatcher: d,
				states: [s0, s1, s2],
				errorState: s404
			});

			expect(JAS.core).toEqual(JAS.Core.getInstance());
			expect(JAS.dispatcher).toEqual(d);
			expect(JAS.states).toEqual([s0, s1, s2]);
			expect(JAS.errorState).toEqual(s404);
			expect(JAS.Core.getInstance().init.bind(JAS.Core.getInstance())).toThrow();
		});

		it("should activate state s1", function() {
			JAS.core.go("home");
			expect(s1.active).toBe(true);
		});

		it("should deactivate state s1 and activate state s2", function() {
			JAS.core.go("detail");
			expect(s1.active).toBe(false);
			expect(s2.active).toBe(true);
		});

		it("should activate error state s404", function() {
			JAS.core.go("existent-state");
			expect(s404.active).toBe(true);
		});

		it("should activate state s2 with params", function() {
			JAS.core.go("detail", { id:101, title:"Super title!" });
			expect(s2.active).toBe(true);
			expect(s2.params).toEqual({ id:101, title:"Super title!" });
		});

		it("should throws exception (Invalid argument)", function() {
			expect(JAS.core.go.bind(JAS.core, "")).toThrow();
		});
	});

	describe("DOM methods", function() {
		beforeEach(function () {
			JAS.core.go("home");
		});
		afterEach(function () {
			JAS.core.removeActions(JAK.gel("test_box"));
			JAK.gel("test_box").innerHTML = '';
		});

		it("should add and remove CoreActions", function() {
			JAK.gel("test_box").innerHTML = '<a href="/" data-action="click">home</a>';

			var added = JAS.core.addActions(JAK.gel("test_box"));
			expect(added).toBe(1);
			var removed = JAS.core.removeActions(JAK.gel("test_box"));
			expect(removed).toBe(added);
		});

		it("should add CoreActions many ways", function() {
			JAK.gel("test_box").innerHTML = '<a href="/" data-action="click:home">home</a>'
			+ '<a href="/" data-action>home</a>'
			+ '<p><span data-action="click:detail">detail</span></p>'
			+ '<a href="/" data-action="hover focus">home</a>'
			+ '<a data-action=":somestate">somestate</a>'
			+ '<a href="http://www.seznam.cz" data-params="">nothing</a>';

			var added = JAS.core.addActions(JAK.gel("test_box"));
			expect(added).toBe(5);
			var removed = JAS.core.removeActions(JAK.gel("test_box"));
			expect(removed).toBe(added);
		});

		if (JAK.cel("span").dispatchEvent && document.createEvent) {
			it("should add CoreActions, react to click and activate state s2", function() {
				// audit
				expect(s2.active).toBe(false);

				// add CoreActions
				JAK.gel("test_box").innerHTML = '<a id="jas_link" href="/detail/621" data-action>detail</a>';
				JAS.core.addActions(JAK.gel("test_box"));

				// run change
				JAK.gel("jas_link").dispatchEvent(createEvent("click"));

				// tests
				expect(s2.active).toBe(true);
				expect(s2.params.id).toBe("621");
			});

			it("should add CoreActions, but doesn't react", function() {
				// add CoreActions
				JAK.gel("test_box").innerHTML = '<a id="jas_link" href="/detail/621" data-action="hover">detail</a>';
				JAS.core.addActions(JAK.gel("test_box"));

				// add listener for cancel default action (which is click through link)
				JAK.Events.addListener(JAK.gel("jas_link"), "click", function(e) { JAK.Events.cancelDef(e); });

				// run change
				JAK.gel("jas_link").dispatchEvent(createEvent("click"));

				// tests
				expect(s2.active).toBe(false);
			});

			it("should add CoreActions, react to myaction and activate state s2 via href and merge params", function() {
				// add CoreActions
				JAK.gel("test_box").innerHTML = '<a id="jas_link" href="/detail/621?show=all" data-action="myaction:home" data-params="{&quot;id&quot;:&quot;622&quot;,&quot;from&quot;:&quot;attr&quot;}">detail</a>';
				JAS.core.addActions(JAK.gel("test_box"));

				// run change
				JAK.gel("jas_link").dispatchEvent(createEvent("myaction"));

				// tests
				expect(s2.active).toBe(true);
				expect(s2.params.id).toBe("622");
				expect(s2.params.show).toBe("all");
				expect(s2.params.from).toBe("attr");
			});
		}

		it("should change state via method go with element as first argument (data-action no needs)", function() {
			JAK.gel("test_box").innerHTML = '<a id="jas_link" href="/detail/621">detail</a>';

			// run change
			JAS.core.go(JAK.gel("jas_link"));

			// tests
			expect(s2.active).toBe(true);
			expect(s2.params.id).toBe("621");
		});

		it("should change state via method go with element as first argument and merge params", function() {
			JAK.gel("test_box").innerHTML = '<a id="jas_link" href="/detail/621?show=all" data-action="myaction:home" data-params="{&quot;id&quot;:&quot;622&quot;,&quot;from&quot;:&quot;attr&quot;}">detail</a>';

			// run change
			JAS.core.go(JAK.gel("jas_link"));

			// tests
			expect(s2.active).toBe(true);
			expect(s2.params.id).toBe("622");
			expect(s2.params.show).toBe("all");
			expect(s2.params.from).toBe("attr");
		});

		it("should change state via method go with element as first argument and merge multiple params", function() {
			JAK.gel("test_box").innerHTML = '<a id="jas_link" href="/detail/621?show=all" data-params="{&quot;id&quot;:&quot;622&quot;,&quot;from&quot;:&quot;attr&quot;}">detail</a>';

			// run change
			JAS.core.go(JAK.gel("jas_link"), { from:"app", reason:"just for fun" });

			// tests
			expect(s2.active).toBe(true);
			expect(s2.params.id).toBe("622");
			expect(s2.params.show).toBe("all");
			expect(s2.params.from).toBe("app");
			expect(s2.params.reason).toBe("just for fun");
		});
	});
});