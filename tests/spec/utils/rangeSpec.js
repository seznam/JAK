describe('Range', function(){
	beforeEach(
		function() {
			var div = JAK.mel("div",{id:"JAKRangeBox"});
			document.body.appendChild(div);
			div.innerHTML = "<span>This is a <u>test</u> <i>str</i>ing. I am your <span>father</span> <b>Luke</b>!</span>";
		}
	);
	
	afterEach(
		function() {
			var testBox = JAK.gel("JAKRangeBox");
			if (testBox) { testBox.parentNode.removeChild(testBox); }
		}
	);
	
	it("should create instance of Range", function() {
		var range = new JAK.Range();
		expect(range instanceof JAK.Range).toEqual(true);
	});
	
	it("should set range on <div id='JAKRangeBox'> content and return its html text", function() {
		var range = new JAK.Range();
		range.setOnNode(JAK.gel("JAKRangeBox"), true);
		
		var text = range.getContentHTML();
		expect(text).toEqual(JAK.gel("JAKRangeBox").innerHTML);
	});
	
	it("should set range on <div id='JAKRangeBox'> and delete it from DOM", function() {
		var range = new JAK.Range();
		var div = JAK.gel("JAKRangeBox");
		range.setOnNode(div);
		range.deleteContent();
		expect(JAK.gel("JAKRangeBox")).toEqual(null);
	});
	
	it("should insert into <div id='JAKRangeBox'> new <span id='newSpan'>", function() {
		var range = new JAK.Range();
		var div = JAK.gel("JAKRangeBox");
		range.setOnNode(div, true);
		range.collapse(true);
		range.insertNode(JAK.mel("span",{id:"newSpan", innerHTML:"&nbsp;"}));
		var span = div.getElementsByTagName("span")[0];
		expect(span.id).toEqual("newSpan");
	});
	
	it("should set range between two nodes (<u>,<i>) of <div id='JAKRangeBox'> and return text:test string. I am your father Luke", function() {
		var range = new JAK.Range();
		var div = JAK.gel("JAKRangeBox");
		var u = div.getElementsByTagName("u")[0];
		var b = div.getElementsByTagName("b")[0];
		range.setBetweenNodes(u, b, true);
		var text = range.getContentText();
		expect(text).toEqual("test string. I am your father Luke");
	});
	
	it("should collapse range to start", function() {
		var range = new JAK.Range();
		var div = JAK.gel("JAKRangeBox");
		range.setOnNode(div, true);
		range.collapse(true);
		var rangeInfo = range.getStartEnd();
		expect(rangeInfo.startContainer).toEqual(div);
		expect(rangeInfo.startOffset).toEqual(0);
		expect(rangeInfo.startContainer).toEqual(rangeInfo.endContainer);
		expect(rangeInfo.startOffset).toEqual(rangeInfo.endOffset);
	});
	
	it("should set range on textNode with offsets 1, 4 and return text:uke", function() {
		var range = new JAK.Range();
		var div = JAK.gel("JAKRangeBox");
		var b = div.getElementsByTagName("b")[0];
		range.setStartEnd(b.firstChild, 1, b.firstChild, 4);
		var text = range.getContentText();
		
		expect(text).toEqual("uke");
	});
	
	it("should execute more difficult removing of nodes and return text:This!", function() {
		var range = new JAK.Range();
		var div = JAK.gel("JAKRangeBox");
		var span = div.firstChild;
		range.setStartEnd(span.firstChild, 4, span, 8);
		range.deleteContent();
		
		expect(span.innerHTML).toEqual("This!");
	});
	
	it("should return right parentNode", function() {
		var range = new JAK.Range();
		var div = JAK.gel("JAKRangeBox");
		var span = div.firstChild;
		range.setOnNode(div, true);
		var parent1 = range.getParentNode();
		range.setOnNode(span, false);
		var parent2 = range.getParentNode();
		
		expect(parent1).toEqual(div);
		expect(parent2).toEqual(div);
	});
	
	it("should select word father in text input", function() {
		var input = JAK.mel("input",{type:"text", value:"I am your father Luke!", id:"JAKRangeInput"});
		document.body.appendChild(input);
		
		var input = JAK.gel("JAKRangeInput");
		JAK.Range.setCaret(input, 10, 16);
		var caret = JAK.Range.getCaret(input);
		expect(input.value.substring(caret.start, caret.end)).toEqual("father");
		
		var input = JAK.gel("JAKRangeInput");
		if (input) { input.parentNode.removeChild(input); }
	});
});
