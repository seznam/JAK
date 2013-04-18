describe("JAK.Template", function() {
	describe("simple usage", function() {
		var T1 = new JAK.Template("aaa {{value}} bbb");
		var T2 = new JAK.Template("aaa {{value1}} bbb {{value2}} ccc");
		
		it("should replace a scalar", function() {
			var data = {value:3};
			expect(T1.render(data)).toEqual("aaa 3 bbb");
		});

		it("should replace a bool", function() {
			var data = {value:true};
			expect(T1.render(data)).toEqual("aaa true bbb");
		});

		it("should replace an undefined value", function() {
			var data = {};
			expect(T1.render(data)).toEqual("aaa  bbb");
		});

		it("should replace a null value", function() {
			var data = {value:null};
			expect(T1.render(data)).toEqual("aaa  bbb");
		});

		it("should replace undefined data root", function() {
			expect(T2.render()).toEqual("aaa  bbb  ccc");
		});	

		it("should replace multiple values", function() {
			var data = {value1:"hello", value2:"world"};
			expect(T2.render(data)).toEqual("aaa hello bbb world ccc");
		});	
	});

	describe("escaping", function() {
		var T1 = new JAK.Template("{{value}}");
		var T2 = new JAK.Template("{{@}}{{value}}{{/}}");
		var T3 = new JAK.Template("{{@text/html}}{{value}}{{/}}");
		var T4 = new JAK.Template("{{@text/javascript}}{{value}}{{/}}");
		var DATA = {value:"<\\"};

		it("should escape text/html by default", function() {
			expect(T1.render(DATA)).toEqual("&lt;\\");
		});	

		it("should accept default contenttype", function() {
			expect(T1.render(DATA, {contentType:"text/javascript"})).toEqual("<\\\\");
		});	

		it("should accept empty contenttype", function() {
			expect(T2.render(DATA)).toEqual("<\\");
		});	

		it("should escape text/html", function() {
			expect(T3.render(DATA)).toEqual("&lt;\\");
		});	

		it("should escape text/javascript", function() {
			expect(T4.render(DATA)).toEqual("<\\\\");
		});	
	});

	describe("conditions", function() {
		var T1 = new JAK.Template("{{#test}} {{test/value}} {{/test}}");
		
		it("should replace truthy condition", function() {
			var data = {test:{value:3}};
			expect(T1.render(data)).toEqual(" 3 ");
		});

		it("should replace falsy condition", function() {
			var data = {test:null};
			expect(T1.render(data)).toEqual("");
		});
	});

	describe("repetition", function() {
		var T1 = new JAK.Template("{{#test}} {{this}} {{/test}}");
		var T2 = new JAK.Template("{{#test}} {{name}} {{/test}}");
		
		it("should replace simple cycle", function() {
			var data = {test:["x", "y", "z"]};
			expect(T1.render(data)).toEqual(" x  y  z ");
		});

		it("should replace simple cycle with sub-values", function() {
			var data = {test:[{name:"x"}, {name:"y"}, {name:"z"}]};
			expect(T2.render(data)).toEqual(" x  y  z ");
		});

		it("should replace falsy cycle", function() {
			var data = {test:0};
			expect(T1.render(data)).toEqual("");
		});

		it("should replace empty cycle", function() {
			var data = {test:[]};
			expect(T1.render(data)).toEqual("");
		});
	});

	describe("iteration meta-variables", function() {
		var T1 = new JAK.Template("{{#test}}{{_number}}{{/test}}");
		var T2 = new JAK.Template("{{#test}}{{_count}}{{/test}}");
		var T3 = new JAK.Template("{{#test}}{{#_last}}{{.}}{{/}}_{{#_first}}{{.}}{{/}}{{/}}");
		
		it("should replace _number", function() {
			var data = {test:["x", "y", "z"]};
			expect(T1.render(data)).toEqual("012");
		});

		it("should replace _count", function() {
			var data = {test:["x", "y", "z"]};
			expect(T2.render(data)).toEqual("333");
		});

		it("should replace _first and _last", function() {
			var data = {test:["x", "y", "z"]};
			expect(T3.render(data)).toEqual("_x_z_");
		});
	});

	describe("negation", function() {
		var T1 = new JAK.Template("aaa {{!value}}xxx{{/}} bbb");

		it("should not replace negated block", function() {
			expect(T1.render({value:3})).toEqual("aaa  bbb");
		});	

		it("should replace negative negated block", function() {
			expect(T1.render({value:0})).toEqual("aaa xxx bbb");
		});	
	});

	describe("advanced paths", function() {
		var T1 = new JAK.Template("{{this}} {{.}}");
		var T2 = new JAK.Template("{{obj1/obj2/value}}");
		var T3 = new JAK.Template("{{#people}} {{name/first}} {{/people}}");
		var T4 = new JAK.Template("{{#people}} {{name/first/../second}} {{/people}}");
		var T5 = new JAK.Template("{{#obj1/obj2}} {{../value1}} {{/obj1/obj2}}");
		var T6 = new JAK.Template("{{#obj1/obj2}} {{.//value1}} {{/obj1/obj2}}");
		var T7 = new JAK.Template("{{#first}}{{#second}}{{value}}{{../common}}{{/second}}{{/first}}");
		
		it("should replace this or .", function() {
			var data = "hello";
			expect(T1.render(data)).toEqual("hello hello");
		});

		it("should replace path", function() {
			var data = {
				obj1: {
					obj2: {
						value: "foo"
					}
				}
			}
			expect(T2.render(data)).toEqual("foo");
		});

		it("should replace subpath", function() {
			var data = {
				people: [
					{name: {first:"A", second:"B"}},
					{name: {first:"C", second:"D"}}
				]
			}
			expect(T3.render(data)).toEqual(" A  C ");
		});

		it("should replace subpath with ..", function() {
			var data = {
				people: [
					{name: {first:"A", second:"B"}},
					{name: {first:"C", second:"D"}}
				]
			}
			expect(T4.render(data)).toEqual(" B  D ");
		});

		it("should replace subpath with .. crossing local root", function() {
			var data = {
				obj1: {
					obj2: true
				},
				value1: "foo"
			}
			expect(T5.render(data)).toEqual(" foo ");
		});

		it("should replace absolute subpath", function() {
			var data = {
				obj1: {
					obj2: true
				},
				value1: "foo"
			}
			expect(T6.render(data)).toEqual(" foo ");
		});

		it("should replace .. crossing multiple array iterations", function() {
			var data = {
				first: [{
					common: "foo",
					second: [
						{value:"A"},
						{value:"B"}
					]
				}, {
					common: "bar",
					second: [
						{value:"C"},
						{value:"D"}
					]
				}]
			}
			expect(T7.render(data)).toEqual("AfooBfooCbarDbar");
		});
	});

	describe("includes", function() {
		var T1 = new JAK.Template("aaa {{#users}} {{>user}} {{/}} bbb");
		var T2 = new JAK.Template("{{name}}");

		it("should include second template", function() {
			var include = {
				user: T2
			}
			var data = {
				users: [{name:"user1"}, {name:"user2"}]
			}

			expect(T1.render(data, {include:include})).toEqual("aaa  user1  user2  bbb");
		});	

		it("should fail with undefined include", function() {
			var data = {
				users: ["user1", "user2"]
			}
			var test = function() {
				T1.render(data);
			}
			expect(test).toThrow();
		});	
	});

});
