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


});