describe("EcmaScript 5 functionality", function(){
	function fa(){
		this.name = 'a';
		this.getName = function() {
			return this.name;
		}
	}

	function fb(){
		this.name = 'b';
	}

	var a  = null;
	var b = null;


	beforeEach(function (){
		a = new fa();
		b = new fb();
	});

	afterEach(function(){
		a = null;
		b = null;
	});

	/**
	 * Function.prototype.bind
	 */
	describe("#bind", function() {
		it("should bind function to instance", function(){
			var x = function(a, b) { return this.a + a + b;  }
			var obj = {a:3};
			var bound = x.bind(obj, 4, 5);
			expect(3 + 4 + 5).toEqual(bound());
		});
	});

	/**
	 * Object.create
	 */
	describe("Object.create", function() {
		it("should create proper prototype", function() {
			var A = {value:42};
			var B = Object.create(A);
			expect(B.value).toEqual(42);
			expect(B.hasOwnProperty("value")).toEqual(false);
		});
	});

	/**
	 * Object.keys
	 */
	describe("Object.keys", function() {
		beforeEach(function () {
			var parentObj = {"pstring": "seznam"};
			a = Object.create(parentObj);
			a["string"] = "seznam";
			a["number"] = 42;
			a["bool"] = true;
			a["null"] = null;
			a["undefined"] = undefined;
		});

		it("should not return inherited properties", function() {
			var keys = Object.keys(a);
			keys.forEach(function(key) {
				expect(a.hasOwnProperty(key)).toBe(true);
			});
		});

		it("should return keys in the same order as for-in loop does", function() {
			var keysOrder = Object.keys(a);
			var i = 0;
			for (var key in a) {
				if (a.hasOwnProperty(key)) {
					expect(key).toEqual(keysOrder[i]);
					i++;
				}
			}
		});

		it("should throw an error if no object is given", function() {
			expect(function() {Object.keys();}).toThrow();
		});
	});

	/**
	 * Array.isArray
	 */
	describe("Array.isArray", function() {
		it("should return true if object is array", function() {
			expect(Array.isArray([])).toBe(true);
		});

		it("should fail if object is anything else than array", function() {
			var values = [
				"string", 42, false, true, {}, null, undefined, document.querySelector("div")
			]
			values.forEach(function(item) {
				expect(Array.isArray(item)).toBe(false);
			});
		});

		it("should return false if no object is given", function() {
			expect(Array.isArray()).toBe(false);
		});
	});

	/**
	 * Array.prototype.reduce
	 */
	describe("Array.prototype.reduce", function() {
		beforeEach(function() {
			a = [-1,-2,0,1,2];
		});

		it("should return expected result", function() {
			var callback = function(prev, curr, i, arr) {
				return prev + curr;
			};
			expect(a.reduce(callback, 5)).toBe(5);
		});

		it("should throw an error if no callback is given", function() {
			expect(function() {
				a.reduce();
			}).toThrow();
		});
	});

	/**
	 * Array.prototype.reduceRight
	 */
	describe("Array.prototype.reduceRight", function() {
		beforeEach(function() {
			a = [-1,-2,0,1,2];
		});

		it("should return expected result", function() {
			var callback = function(prev, curr, i, arr) {
				return prev + curr;
			};
			expect(a.reduceRight(callback, 5)).toBe(5);
		});

		it("should throw an error if no callback is given", function() {
			expect(function() {
				a.reduceRight();
			}).toThrow();
		});
	});
});
