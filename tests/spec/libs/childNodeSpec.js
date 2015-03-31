describe("childNode", function() {
	var frag = null;
	var DOM = '' +
		'<div id="node0"></div>' +
		'<div id="node1"></div>' +
		'<div id="node2">' +
			'<div id="node2-0"></div>' +
			'<div id="node2-1"></div>' +
		'</div>' +
		'<div id="node3"></div>' +
		'<div id="node4"></div>' +
		'<div id="node5"></div>' +
	'';

	beforeEach(function() {
		var d = document.createElement("div");
		d.insertAdjacentHTML("afterbegin", DOM);
		frag = document.createDocumentFragment();
		frag.appendChild(d);
	});

	describe("remove", function() {
		it("should return null for removed node", function(){
			var node = frag.querySelector("#node0");
			node.remove();
			expect(frag.querySelector("#node0")).toEqual(null);
		});

		it("should return null for removed child node", function(){
			var node = frag.querySelector("#node2");
			node.remove();
			expect(frag.querySelector("#node2-0")).toEqual(null);
		});
	});

	describe("after", function() {
		it("append nothing, should return same number nodes", function() {
			var node = frag.querySelector("#node5");
			var num = frag.querySelectorAll("div[id^=node]").length
			node.after();
			expect(frag.querySelectorAll("div[id^=node]").length).toEqual(num);
		});

		it("append text node, should check appended nodes", function() {
			var node = frag.querySelector("#node5");
			node.after("<span>a</span>", document.createTextNode("b"));
			expect(node.nextSibling.innerHTML).toEqual("a");
			expect(node.nextSibling.nextSibling.nodeType).toEqual(3);
			expect(node.nextSibling.nextSibling.nodeValue).toEqual("b");
		});

		it("append DOM with children", function() {
			var node = frag.querySelector("#node5");
			var num = frag.querySelectorAll("div[id^=node]").length;
			node.after("<span>c<div>a</div></span>b");
			expect(node.nextSibling.childNodes[0].nodeValue).toEqual("c");
			expect(node.nextSibling.childNodes[1].innerHTML).toEqual("a");
			expect(node.nextSibling.nextSibling.nodeValue).toEqual("b");
		});
	});

	describe("before", function() {
		it("append nothing, should return same number nodes", function() {
			var node = frag.querySelector("#node5");
			var num = frag.querySelectorAll("div[id^=node]").length
			node.before();
			expect(frag.querySelectorAll("div[id^=node]").length).toEqual(num);
		});

		it("append text node, should check appended nodes", function() {
			var node = frag.querySelector("#node5");
			var num = frag.querySelectorAll("div[id^=node]").length;
			node.before("<span>a</span>", document.createTextNode("b"));
			expect(node.previousSibling.previousSibling.innerHTML).toEqual("a");
			expect(node.previousSibling.nodeType).toEqual(3);
			expect(node.previousSibling.nodeValue).toEqual("b");
		});

		it("append DOM with children", function() {
			var node = frag.querySelector("#node5");
			var num = frag.querySelectorAll("div[id^=node]").length;
			node.before("<span>c<div>a</div></span>b");
			expect(node.previousSibling.nodeValue).toEqual("b");
			expect(node.previousSibling.previousSibling.childNodes[0].nodeValue).toEqual("c");
			expect(node.previousSibling.previousSibling.childNodes[1].innerHTML).toEqual("a");
		});
	});

	describe("replaceWith", function() {
		it("replace nothing, alias for remove", function() {
			var node = frag.querySelector("#node2");
			node.replaceWith();
			expect(frag.querySelector("#node2") && frag.querySelector("#node2-0")).toEqual(null);
			node = frag.querySelector("#node5");
			node.replaceWith();
			expect(frag.querySelector("#node5")).toEqual(null);
		});

		it("replace div, with children", function() {
			var node = frag.querySelector("#node2");
			node.replaceWith("<div>a</div>");
			expect(frag.querySelector("#node1").nextSibling.innerHTML).toEqual("a");
			node = frag.querySelector("#node5");
			node.replaceWith("a<div>b</div>");
			expect(frag.querySelector("#node5")).toEqual(null);
			expect(frag.querySelector("#node4").nextSibling.nodeValue).toEqual("a");
			expect(frag.querySelector("#node4").nextSibling.nextSibling.innerHTML).toEqual("b");
		});
	});
});
