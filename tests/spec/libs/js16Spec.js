describe("Javascript 1.6 aligned functions", function(){
    describe("Array.prototype", function(){
        describe("#indexOf", function(){		
    		/**
    		 * par testu na sedm novych metod poli
    		 */		 				
    		
    		it("should be used on array instance", function() {
    			expect(["a","b","c"].indexOf("b")).toEqual(1);
    		});
    
    		it("should be used also statically", function() {
    			expect( Array.indexOf(["a","b","c"],"b")).toEqual(1);
    			
    			expect(Array.indexOf(["a","b","c","b"],"b",2)).toEqual(3);
    		});
    
    		it("should return -1 when element not found",function() {
    			expect(Array.indexOf(["a","b","c"],"x")).toEqual(-1);
    	
    			expect(Array.indexOf(["a","b","c"],"b",2)).toEqual(-1);
    		});
        });    		
    	describe("#lastIndexOf", function(){	
      		it("should return index of last occurent position",function() {
    			expect(["b","b","c"].lastIndexOf("b")).toEqual(1);
    		});
    
    		it("should also work statically", function() {
    			expect(Array.lastIndexOf(["b","b","c"],"b")).toEqual(1);
    			expect(Array.lastIndexOf(["a","b","b","c"],"b",1)).toEqual(1);
    		});
    
    		it("should not return index of non existing element",function() {
    			expect(Array.lastIndexOf(["a","b","c"],"x")).toEqual(-1);

    			expect(Array.lastIndexOf(["a","c","b"],"b",1)).toEqual(-1);
    		});

		});
		describe("#forEach", function(){
    		it("should be called statically", function() {
    			var a = [1,2,3]; 
    			Array.forEach(a,function(x,i,a){a[i]=x*x;}); 
    			expect(a[0]).toEqual(1);
                expect(a[1]).toEqual(4);
                expect(a[2]).toEqual(9);
    		});
    	});
    	describe("#map", function(){
    		it("should be called statically",function() {
    			var a = [1,2,3];
    			Array.map(a,function(x,i,a){a[i]=x*x;});
    			expect(a[0]).toEqual(1);
                expect(a[1]).toEqual(4);
                expect(a[2]).toEqual(9);
    		});
    	});
    	describe("#filter", function(){
    		it("should be called statically",function() {
    			var a = Array.filter([1,2,3,4,5],function(x){return x%2;});
    			expect(a.length).toEqual(3);
    			expect(a[1]).toEqual(3);
    		});
    	});
        describe("#every", function(){
    		it("should be called statically",function() {
    			expect(Array.every([1,2,3,4,5],function(x){return x%2;})).toEqual(false);
    			expect(Array.every([1,3,5],function(x){return x%2;})).toEqual(true);
    		});
        });
        describe("#some", function(){
    		it("should be called statically",function() {
    			expect(Array.some([1,2,3,4,5],function(x){return x%2;})).toEqual(true);
    			expect(Array.some([2,4,6],function(x){return x%2;})).toEqual(false);
    		});
    	});
    });
});

describe("Misc JS enhancements", function(){
	describe("Date.now", function() {		
		it("should exist and return a timestamp", function() {
			expect(typeof Date.now()).toEqual("number");
		});
	});
    describe("String.prototype.localeCSCompare", function() {
        it("should return number < 0 if the string comes before the given string, 0 if the string is equal to given string, and number > 0 if the string comes after the given string", function() {
            expect("rum".localeCSCompare("čaj") > 0).toEqual(true);
            expect("čaj".localeCSCompare("čaj") == 0).toEqual(true);
            expect("cus".localeCSCompare("cusik") < 0).toEqual(true);
            expect("atd...".localeCSCompare("atdale") < 0).toEqual(true);
            expect("chrchel".localeCSCompare("chobot") > 0).toEqual(true);
            expect("chrchel".localeCSCompare("cumel") > 0).toEqual(true);
        });
    });
});
