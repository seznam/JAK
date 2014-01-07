describe("JAS", function() {
	console.DEBUG = true; //FIXME
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
});