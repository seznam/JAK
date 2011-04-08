describe("ClassMaker Base", function(){
    var RefClass = function(name,title){
        this.name = name;
        this.title = title;
    };

    RefClass.NAME = "RefClass";
    RefClass.VERSION = "1.0";
    RefClass.CLASS = "class";
    /*
    RefClass.prototype.$constructor = function(){

    };
    */
    RefClass.prototype.$destructor = function(){
        for(var i in this){
            this[i] = null;
        }
    };

    RefClass.prototype.get = function(){
        return this.name;
    };


    var MyClass = JAK.ClassMaker.makeClass({
        NAME:"RefClass", /* tohle je spravne! test porovnava shodu s RefClass.NAME! */
        VERSION:"1.0",
        CLASS : "class"
    });

    MyClass.prototype.$constructor = function(name,title){
        this.name = name;
        this.title = title;
    };

    MyClass.prototype.$destructor = function(){
        for (var p in this) { this[p] = null; }
    };

    MyClass.prototype.get = function(){
        return this.name;
    };



    var tst = null;
    var ref = null;


    beforeEach(function(){
        ref = new RefClass('RefClass','refClass');
        tst = new MyClass('RefClass','refClass');
    });

    afterEach(function(){
        tst = null;
        ref = null;
    });

    describe("getting static variables", function(){
        it("should return variable NAME value", function(){
            expect(ref.constructor.NAME).toEqual(tst.constructor.NAME);
        });

        it("should return variable VERSION value", function(){
            expect(ref.constructor.VERSION).toEqual(tst.constructor.VERSION);
        });
    });

    describe("internal variables and methods testing", function(){
        it("should contain method get()",function(){
            expect(ref['get']).toBeTruthy();
            expect(ref.get instanceof Function).toBeTruthy();
        });

        /* test shodnych vlastnosti s ereferencnim objektem */
        it('should instantiate two objects from two "same" classes with same variables',function(){
            for(var i in ref){
                if(i == 'constructor') {
                    continue;
                }
                var a = typeof ref[i];
                var b = typeof tst[i];
                expect(a).toEqual(b);
            }
        });
    });

    describe('destructor should delete all internal members', function(){
			/* test dchovani destructoru */
			it("should delete all internal members",function(){
				tst.$destructor();
				for(var i in tst){
					expect(tst[i]).toBe(null);
				}				
			});
    });
			
			/* test ukonceni tvorby tridy pokud neni definovano NAME*/
    describe("testing non-creating class when NAME variable is missing", function(){
			it ("should raise error when NAME is missing", function() {
				function verify() {
					try {
						JAK.ClassMaker.makeClass({
							VERSION: '1.0'
						});	
						return true;
					} catch(e) {
						return false;
					}
				}
				expect(verify()).toEqual(false);
			});
    });
});