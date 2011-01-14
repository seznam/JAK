describe('Parser', function() {
    describe('Color', function() {
		it('should not parse invalid color string', function() {
			var c = JAK.Parser.color("sracky");
			expect(c).toEqual(false);
			var c = JAK.Parser.color("#abcd");
			expect(c).toEqual(false);
			var c = JAK.Parser.color("#abcdhh");
			expect(c).toEqual(false);
			var c = JAK.Parser.color("abcdef");
			expect(c).toEqual(false);
		});
		
        it('should parse string with hex color starting #', function(){	
			var c = JAK.Parser.color("#1234ab");
			expect(c).not.toEqual(false);
			expect(c.r).toEqual(18);
			expect(c.g).toEqual(52);
			expect(c.b).toEqual(171);
		});
		
		it('should parse string with rgb color string rgb(18,52,171)', function(){
			var c = JAK.Parser.color("  rgb ( 18 , 52, 171);");
			expect(c).not.toEqual(false);
			expect(c.r).toEqual(18);
			expect(c.g).toEqual(52);
			expect(c.b).toEqual(171);
		});
		
		it('should not parse string with rgb color string rgb(18,52,300)', function(){
			var c = JAK.Parser.color("rgb(18,52,300)");
			expect(c).toEqual(false);
		});
	});

	describe('Email', function() {
	   it('should detect wrong email', function() { 
			var e = JAK.Parser.email("falesny@email");
			expect(e).toEqual(false);
			var e = JAK.Parser.email("jiny.falesny@email.x");
			expect(e).toEqual(false);
			var e = JAK.Parser.email("zase_neco@jineho@domena.cz");
			expect(e).toEqual(false);
		});
			
		it('should parse email stara@buzna.com from string', function() {
			var e = JAK.Parser.email("stara@buzna.com");
			expect(e).not.toEqual(false);
			expect(e.mailbox).toEqual("stara");
			expect(e.domain).toEqual("buzna");
			expect(e.tld).toEqual("com");
		});
		
		it('should parse email a123_-.1@a-a.aero from string', function() {
			var e = JAK.Parser.email("a123_-.1@a-a.aero");
			expect(e).not.toEqual(false);
			expect(e.mailbox).toEqual("a123_-.1");
			expect(e.domain).toEqual("a-a");
			expect(e.tld).toEqual("aero");
		});
	});

	describe('Date', function() {
	   it('should parse Czech date and time', function() {
			var d = JAK.Parser.date("8.5.2003 15:54:33");
			expect(d).not.toEqual(false);
			expect(d.year).toEqual(2003);
			expect(d.month).toEqual(4);
			expect(d.day).toEqual(8);
			expect(d.hours).toEqual(15);
			expect(d.minutes).toEqual(54);
			expect(d.seconds).toEqual(33);
		});
		
		it('should not parse 10/13/2000', function() {
            var d = JAK.Parser.date("10/13/2000");
            expect(d).toEqual(false);
        });
        
        it('should not parse 10/0/2000', function() {
            var d = JAK.Parser.date("10/0/2000");
            expect(d).toEqual(false);
        });
        
        it('should not parse 35/10/2000', function() {
            var d = JAK.Parser.date("35/10/2000");
            expect(d).toEqual(false);
        });
		
        it('should parse 3/7/58 as 3th Juli 1958', function(){	
			var d = JAK.Parser.date("3/7/58");
			expect(d.year).toEqual(1958);
			expect(d.month).toEqual(6);
			expect(d.day).toEqual(3);
		});
			
		it('should parse 5-5-5 as 5th May 2005', function() {
			var d = JAK.Parser.date("5-5-5");
			expect(d.year).toEqual(2005);
			expect(d.month).toEqual(4);
			expect(d.day).toEqual(5);
		});
	});



});