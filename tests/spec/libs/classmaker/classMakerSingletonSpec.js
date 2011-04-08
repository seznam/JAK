describe('ClassMaker singleton', function(){
    var singletonParams = {
        NAME:"Singleton",
        VERSION:"1.0"
    };
    var Singleton = JAK.ClassMaker.makeSingleton(singletonParams);

    Singleton.prototype.$constructor = function(){
        this.parameter = 333;
    };

    Singleton.prototype.getParameter = function(){
        return this.parameter;
    };

    var tst = null;
    var ref = null;

    beforeEach(function(){
        ref = Singleton.getInstance();
        tst = Singleton.getInstance();
    });

    afterEach(function(){
        tst = null;
        ref = null;
    });

    describe('static attributes', function(){
        it('should return NAME attribute',function(){
            expect(ref.constructor.NAME).toEqual(singletonParams.NAME);
        });

        it('should return VERSION attribute',function(){
            expect(ref.constructor.VERSION).toEqual(singletonParams.VERSION);
        });
    });

    describe('testing getParametr method', function(){
        it('should inherit method getParametr',function(){
            expect(!!ref.getParameter).toEqual(true);
        });

        it('should return right value',function(){
            expect(ref.getParameter()).toEqual(333);
        });
    });

    describe('testing that we have only one instance', function(){
			
        it('should still live when we delete one "instance" / reference',function() {
            delete(tst);
            expect(ref).not.toBe(undefined);

            tst = Singleton.getInstance();
            expect(ref).toBe(tst);
        });

        it('should throw error when we try to create new instance using singleton constructor',function() {
            function verify() {
                try {
                    var a = new Singleton();
                    return true;
                } catch(e) {
                    return false;
                }
            }
            expect(verify()).toBe(false);
        });

        it('should not create instance calling the singleton constructor even if there is no "first" instance yet',function() {
            var Test = JAK.ClassMaker.makeSingleton({
                NAME: "Test",
                VERSION: "1.0"
            });

            function verify() {
                try {
                    var a = new Test();
                    return true;
                } catch(e) {
                    return false;
                }
            }
            expect(verify()).toBe(false);
        });
    });
});
