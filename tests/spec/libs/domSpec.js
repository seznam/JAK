describe("DOM", function(){
    var rootElm;
    
    beforeEach(function() {
        rootElm = document.getElementById('test_box');
    });
    
    afterEach(function() {
        rootElm = null;
    });
    
    describe("#cel", function(){
		it("should create correct simple element", function() {
			var e = JAK.cel("div", "nejakaclasa", "nejakeid");
			rootElm.appendChild(e);
			
            expect(e.tagName.toLowerCase()).toEqual("div");
			expect(e.id).toEqual("nejakeid");
			expect(e.className).toEqual("nejakaclasa");
		});
	});    
    describe("#mel", function(){		
		it("should create correct element", function(){
			var e = JAK.mel("div", {id:"nejakeid", className:"nejakaclasa"}, {fontFamily:"arial"});
			rootElm.appendChild(e);
			
			expect(e.tagName.toLowerCase()).toEqual("div");
			expect(e.id).toEqual("nejakeid");
			expect(e.className).toEqual("nejakaclasa");
			expect(JAK.DOM.getStyle(e,"fontFamily").toLowerCase()).toEqual("arial");
		});
	});
	describe("#query", function() {
		it("should return array of nodes which complain to CSS1 query", function() {
			var parent = JAK.cel("div", null, "query_test");
			rootElm.appendChild(parent);
			parent.innerHTML = "<ul>" +
			"<li><span>aaa</span></li>" +
			"<li><span class='ahoj'>bbb</span></li>" +
			"<li><span class='ahoj vole'>ccc</span></li>" +
			"<li><span id='id1'>ddd</span></li>" +
			"<li><div><span>eee</span></div></li>" +
			"<li><div class='prvni'><div class='druha'><span>fff</span></div></div></li>" +
			"</ul>";
			
			var results = {
				"#query_test": 1,
				"#query_test cyp": 0,
				"#query_test div#cyp": 0,
				"#query_test div": 3,
				"#query_test li": 6,
				"#query_test li.a": 0,
				"#query_test .ahoj": 2,
				"#query_test span.ahoj.vole": 1,
				"#query_test div span": 2,
				"#query_test .prvni .druha span": 1,
				"#query_test #id1, #query_test .prvni": 2,
				"#query_test .ahoj, #query_test .druha": 3
			};
			
			for (var p in results) {
				expect(results[p]).toEqual(JAK.query(p).length);
			}
			
		});
    });
	describe("#ctext", function(){	
		it("should create text node",function() {
			var t = JAK.ctext("ahoj");
			expect(t.nodeType).toEqual(3);
			expect(t.nodeValue).toEqual("ahoj");
		});
	});
	describe("#addClass", function(){
        it("should create class attribute to element", function() {
            var d = JAK.cel("div");
			JAK.DOM.addClass(d,"c1");
			
			expect(d.className).toEqual(" c1");
        });
        it("should add class to the end of class attribute in element", function() {
            var d = JAK.cel("div");
            d.className = 'c0';
			JAK.DOM.addClass(d,"c1");
			
			expect(d.className).toEqual("c0 c1");
        });
    });	
    describe("#hasClass", function() {
		it("should return true if node has concrete class", function() {
			var d = JAK.cel("div");
			JAK.DOM.addClass(d,"c1");
			expect(JAK.DOM.hasClass(d,"c1")).toEqual(true);
			expect(JAK.DOM.hasClass(d,"c2")).toEqual(false);
			JAK.DOM.addClass(d,"c2");
			expect(JAK.DOM.hasClass(d,"c1"), true);
			expect(JAK.DOM.hasClass(d,"c2"), true);
			
			var d2 = JAK.cel("div");
			d2.className = "c1";
			expect(JAK.DOM.hasClass(d2,"c1")).toEqual(true);
		});
	});
	
	describe("#removeClass", function() {
		it("should return true if node has concrete class", function() {
			var d = JAK.cel("div");
			JAK.DOM.addClass(d,"c1");
			expect(JAK.DOM.hasClass(d,"c1")).toEqual(true);
			expect(JAK.DOM.hasClass(d,"c2")).toEqual(false);
			JAK.DOM.removeClass(d,"c1");
			expect(JAK.DOM.hasClass(d,"c1")).toEqual(false);
		});
	});
	describe("#gel", function() {	
		it("should return node with defined id", function() {
			var d = JAK.cel("div", null, "mujdiv");
			rootElm.appendChild(d);
			expect(JAK.gel("mujdiv")).toEqual(d);
			expect(JAK.gel(d)).toEqual(d);
		});
		it("should return null when there isn't element with search id", function() {
			var d = JAK.cel("div", null, "mujdiv");
			rootElm.appendChild(d);
			expect(JAK.gel("tvujdiv")).toEqual(null);
		});
	});
	describe("#append", function(){	
		it("should append array of nodes into parent node", function() {
			var p = JAK.cel("div");
			var a = [];
			for (var i=0;i<3;i++) {
				var ch = JAK.cel("div");
				a.push(ch);
			}
			JAK.DOM.append([p,a[0],a[1]],[a[1],a[2]]);
			expect(p.childNodes.length).toEqual(2);
			expect(a[2].parentNode).toEqual(a[1]);
			JAK.DOM.clear(p);
			expect(p.childNodes.length).toEqual(0);
		});
	});
	describe("#getElementsByClass", function(){	
		it("should return all elements by given class name", function() {
			var d = JAK.cel("div");
			var a1 = JAK.cel("a", "c");
			var a2 = JAK.cel("a", "c");
			var a3 = JAK.cel("a", "d");
			rootElm.appendChild(a1);
			d.appendChild(a3);
			a3.appendChild(a2);
			rootElm.appendChild(d);
			
			var list = JAK.DOM.getElementsByClass("c");
			expect(list.length).toEqual(2);
			
			var list = JAK.DOM.getElementsByClass("c",d);
			expect(list.length).toEqual(1);
			expect(list[0]).toEqual(a2);

			var list = JAK.DOM.getElementsByClass("c", false, "span");
			expect(list.length).toEqual(0);			
		});
	});	
	describe("#setStyle", function() {
		it("should set style object to given element", function() {
			var d = JAK.cel("div");
			rootElm.appendChild(d);
			JAK.DOM.setStyle(d, {marginLeft:"2px",lineHeight:"10px"} );
			expect(JAK.DOM.getStyle(d,"lineHeight")).toEqual("10px");			
			expect(JAK.DOM.getStyle(d,"marginLeft")).toEqual("2px");			
		});
	});
	describe("#getBoxScroll", function(){	
		it("should return proper box scroll offset", function() {
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
			var d = JAK.mel("div", null, {position:"absolute",top:"0px",overflow:"scroll",height:"100px"});
			var dd1 = JAK.mel("div", null, {height:"100px",width:"10px"});
			var dd2 = JAK.mel("div", null, {height:"100px",width:"10px"});
			d.appendChild(dd1);
			d.appendChild(dd2);
			rootElm.appendChild(d);
			d.scrollTop = 100;
			var scroll = JAK.DOM.getBoxScroll(dd2);
			expect(scroll.y).toEqual(100);				
		});
		it("should return propper scroll offset of the element when the window is scrolled down", function() {
			var elms = [];
			var st = 100;
			var limit = 10;
			var counter = 0;
			do {
				counter++;
				var div = JAK.mel("div", null, {height:"100px"});
				elms.push(div);
				rootElm.appendChild(div);
				window.scrollTo(0, st);
			} while (document.documentElement.scrollTop != st && counter < limit);
			var div = JAK.cel("div");
			elms.push(div);
			rootElm.appendChild(div);
			var pos = JAK.DOM.getBoxScroll(div);
			expect(st).toEqual(pos.y);
			
			for (var i=0;i<elms.length;i++) {
				elms[i].parentNode.removeChild(elms[i]);
			}
		});
	});
	describe("#getPortBoxPosition", function(){	
		it("should return proper element position in window", function() {
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
			var d = JAK.mel("div", null, {position:"absolute",top:"0px",overflow:"scroll",height:"100px"});
			var dd1 = JAK.mel("div", null, {height:"100px",width:"10px"});
			var dd2 = JAK.mel("div", null, {height:"100px",width:"10px"});
			d.appendChild(dd1);
			d.appendChild(dd2);
			rootElm.appendChild(d);
			d.scrollTop = 100;
			var pos = JAK.DOM.getPortBoxPosition(dd2);
			expect(pos.top).toEqual(0);			
		});
	});
    describe("#separateCode", function() {
		it("should separate javascript code from other html code", function() {
			var part1 = "ahoj";
			var part2 = "<strong>neco</strong>";
			var part3 = "nazdar";
			var tmp = 0;
			
			var html = part1;
			html += "<scr" + "ipt>tmp = 6;</scr" + "ipt>";
			html += part2;
			html += "<scr" + "ipt type='text/javascript'>tmp += 7;</scr" + "ipt>";
			html += part3;
			
			var data = JAK.DOM.separateCode(html);
			expect(part1+part2+part3).toEqual(data[0]);
			eval(data[1]);
			expect(13).toEqual(tmp);
		});
	});

});
