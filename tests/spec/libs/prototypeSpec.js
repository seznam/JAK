describe("Other prototypes", function(){
    describe("String.prototype", function() {
		describe("#lpad", function(){
    		it("should pad string from left side",function() {
    			expect("03").toEqual("3".lpad());
    			expect("333").toEqual("333".lpad());  
    			expect("xx3").toEqual("3".lpad("x", 3));  
            });
            //TODO: test also negative number and more then one char to pad with
            it("should pad string from right side",function() {
    			expect("30").toEqual("3".rpad());
    			expect("333").toEqual("333".rpad());  
    			expect("3xx").toEqual("3".rpad("x", 3));  
            });
            it("should trim leading and trailing spaces from string",function() {
    			expect("hello \r\n dolly").toEqual("  \n hello \r\n dolly\t".trim());
    			expect("hello dolly").toEqual("hello dolly".trim()); 
    		}); 
    	});
    }); 
    describe("Date.prototype", function(){
        describe("#format", function(){
    		it("should return formated string", function() {  
    			var d = new Date();
    			d.setMilliseconds(0); 
    			d.setSeconds(1);
    			d.setMinutes(2);
    			d.setHours(3);  
    			d.setDate(4);
    			d.setMonth(0);  
    			d.setFullYear(2006);  
    			var result = d.format("! d j N S w z W m n t L Y y a A g G h H i s U");  
    			
    			var ts = 1136343721;
    			ts += d.getTimezoneOffset()*60;
    
    			var str = "! 04 4 3 th 3 3 01 01 1 31 0 2006 06 am AM 3 3 03 03 02 01 " + ts;
    			expect(str).toEqual(result); 
    		});
    	});
	});
});
