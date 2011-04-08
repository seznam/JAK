describe('Object', function(){
    var bl;

    var testObj_1 = {
        a : 8,
        b : 'kar\nel',
        c : new String('johana'),
        d : new RegExp("\\.*",'g'),
        e : {
            f : new Boolean(true),
            g : new Number(895),
            h : new Date(),
            ee : {
                aa : 1,
                bb : 2
            }
        },
        k : null,
        l : bl,
        m : [
            1,
            'nazdarek',
            new String('Pavla'),
            new RegExp("[a-z]","gi")
        ]
    };

    var testObj_2 = {
        a : 8,
        b : 'karel',
        c : new String('johana'),
        d : new RegExp("\\.*",'g'),
        e : {
            f : new Boolean(true),
            g : new Number(895),
            h : new Date(),
            ee : {
                aa : 1,
                bb : 2
            }
        },
        k : null,
        l : 'undefined',
        m : [
            1,
            'nazdarek',
            new String('Pavla'),
            new RegExp("[a-z]","gi")
        ]
    };
    // priprava a vytvoreni objektu s cyklickou referenci
    var TestObj_3 = function(){
        this.a = 1;
        this.b = 'Karel';
        this.c = this;
    }
    var testObj_3 = new TestObj_3();
    // priprava a vytvoreni objektu s metodou
    var TestObj_4 = function(){
        this.a = 1;
        this.b = 'Karel';
        this.c = function(){
            return this.b;
        };
    }
    var testObj_4 = new TestObj_3();
			
	describe('testing object serializing and deserializing', function(){
        it('should be identical object after serialize/unserialize', function(){
            var cp = new JAK.ObjLib();
            var a = cp.unserialize(cp.serialize(testObj_1));

            var out = cp.match(a,testObj_1);
            expect(out).toBe(true);

            //is copied object identical?
            var out = cp.match(cp.copy(testObj_1),testObj_1);
            expect(out).toBe(true);

            //different objects are not identical
            var out = cp.match(testObj_1,testObj_2);
            expect(out).toBe(false);
        });

        it('should fail when object has methods',function(){
            var tt = true;
            var cp =  new JAK.ObjLib();

            try {
                cp.serialize(testObj_4);
                tt = false
            } catch(e){

            } finally {
                expect(tt).toBe(true);
            }

            var tt = true;
            try {
                cp.serialize(testObj_3);
                tt = false
            } catch(e){

            } finally {
                expect(tt).toBe(true);
            }

        });

        it('should fail when we reach the depth limit', function(){
            var cp =  new JAK.ObjLib();
            cp.reSetOptions({depth:1},true);
            var tt = true
            try {
                var x = cp.serialize(testObj_2);
                tt = false
            } catch(e){

            } finally {
                expect(tt).toBe(true);
            }
        });

        it('should also serialize primitive variables', function(){
            var cp =  new JAK.ObjLib();
            var a = 'petr';
            var b = 8;
            var c = true;

            var aa = cp.unserialize(cp.serialize(a));
            var bb = cp.unserialize(cp.serialize(b));
            var cc = cp.unserialize(cp.serialize(c));

            expect(a).toEqual(aa);
            expect(b).toEqual(bb);
            expect(c).toEqual(cc);
        });
    });
});