describe('ClassMaker interface', function(){
			
    var interfaceParams = {
        NAME:"IMovable",
        VERSION:"1.0"
    };
    var IMovable = JAK.ClassMaker.makeInterface(interfaceParams);

    //tento konstruktor by to nemelo nikdy zavolat
    IMovable.prototype.$constructor = function(){
        this.parameter = 333;
    };


    IMovable.prototype.getParameter = function(){
        return this.parameter;
    };


    var Trida = JAK.ClassMaker.makeClass({
        NAME: 'Trida',
        VERSION: '1.0',
        IMPLEMENT: [IMovable]
    });

    Trida.prototype.$constructor = function() {
        this.parameter = 666;
    };


    var ref = null;
    beforeEach(function(){
        ref = new Trida();
    });

    afterEach(function(){
    ref = null;
    });
			

	describe('getting methods from interface', function(){
        it('should get method getParametr from interface',function(){
            expect(!!ref.getParameter).toBe(true);
        });

        it('should return right value from class Trida constructor',function(){
            expect(ref.getParameter()).toEqual(666);
        });

    });

	it('should not be possible to create instance from interface',function() {
        function verify() {
            try {
                var a = new Interface();
                return true;
            } catch(e) {
                return false;
            }
        }
        expect(verify()).toEqual(false);
    });
});
