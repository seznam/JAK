describe("classList", function(){
	var node = null;
	beforeEach(function() {
		node = document.createElement("div");
		node.className = "aaa bbb";
	})
	
	describe("contains", function() {
		it("should return true for an existing class", function(){
			expect(node.classList.contains("aaa")).toEqual(true);
		});

		it("should return false for a non-existing class", function(){
			expect(node.classList.contains("ccc")).toEqual(false);
		});
	});

	describe("toggle", function() {
		it("should toggle an existing class", function() {
			node.classList.toggle("aaa");
			expect(node.classList.contains("aaa")).toEqual(false);
		});

		it("should toggle a non-existing class", function() {
			node.classList.toggle("ccc");
			expect(node.classList.contains("ccc")).toEqual(true);
		});

		it("should toggle with second argument", function() {
			node.classList.toggle("ccc", false);
			expect(node.classList.contains("ccc")).toEqual(false);
		});
	});

	describe("add", function() {
		it("should add a new class", function() {
			node.classList.add("ccc");
			expect(node.classList.contains("ccc")).toEqual(true);
		});

		it("should not touch an existing class class", function() {
			node.classList.add("aaa");
			expect(node.className).toEqual("aaa bbb");
		});

		it("should add with more arguments than one", function() {
			node.classList.add("ccc", "ddd", "eee");
			expect(node.className).toEqual("aaa bbb ccc ddd eee");
		});
	});

	describe("remove", function() {
		it("should remove an existing class", function() {
			node.classList.remove("aaa");
			expect(node.classList.contains("aaa")).toEqual(false);
			expect(node.classList.contains("bbb")).toEqual(true);
		});

		it("should do nothing with a non-existing class", function() {
			node.classList.remove("ccc");
			expect(node.classList.contains("aaa")).toEqual(true);
			expect(node.classList.contains("bbb")).toEqual(true);
			expect(node.classList.contains("ccc")).toEqual(false);
		});

		it("should remove with more arguments than one", function() {
			node.classList.remove("bbb", "ccc");
			expect(node.classList.contains("aaa")).toEqual(true);
			expect(node.classList.contains("bbb")).toEqual(false);
			expect(node.classList.contains("ccc")).toEqual(false);
		});
	});
});
