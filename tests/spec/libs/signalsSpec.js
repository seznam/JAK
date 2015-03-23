describe('Signals', function(){
    var s1, s2,r1,d1,s;

    beforeEach(function() {
        var dummy = JAK.ClassMaker.makeClass({
            NAME:"dummy"
        });
        dummy.prototype.$constructor = function(s) {
            this.signals = s;
            this.reset();
        }
        dummy.prototype.reset = function() {
            this.answered = false;
        }
        dummy.prototype.answer = function() {
            this.answered = true;
        }
        dummy.prototype.add = function(name,sender) {
            this.signalId = this.signals.addListener(this,name,"answer",sender);
        }
        dummy.prototype.addall = function() {
            this.allId = this.signals.addListener(this,"*","answer");
        }
        dummy.prototype.remove = function() {
            this.signals.removeListener(this.signalId);
        }
        dummy.prototype.removeBad = function() {
            this.signals.removeListener("salala");
        }
        dummy.prototype.removeall = function() {
            this.signals.removeListener(this.allId);
        }
        dummy.prototype.send = function(name) {
            this.signals.makeEvent(name,this,false);
        }

        dummy.prototype.sendWithData = function(name,data){
            this.signals.makeEvent(name,this,data);
        }
        dummy.prototype.answerWithData = function(evnt){
            this.data = evnt.data.item;
        }
        dummy.prototype.addWithData = function(name,sender){
            this.signals.addListener(this,name,"answerWithData",sender);
        }
        dummy.prototype.resetWithData = function(){
            this.data = 0;
        }
        var signals = new JAK.Signals();
        s1 = new dummy(signals);
        s2 = new dummy(signals);
        r1 = new dummy(signals);
        d1 = new dummy(signals);
        s = signals;
    });

    afterEach(function() {
        delete s;
        delete s1;
        delete s2;
        delete r1;
        delete d1;
        delete s;
    });

    describe('#addListener', function() {
        it('should add same listener only once', function(){
            var a = JAK.ClassMaker.makeClass({
                NAME:"a",
                CLASS:"class"
            });

            a.prototype.$constructor = function() {

            }

            a.prototype.add = function() {
                return JAK.signals.addListener(this, 'test', "answer", window.s1);
            }

            a.prototype.test = function() {}


            var objA = new a();
            expect(objA.add()).not.toEqual(null);
            expect(objA.add()).toEqual(null);
        });
    });

    describe('testing that all listeners gets their messages', function(){
        it('should not have any answer at the begining',function() {
            r1.reset();
            expect(r1.answered).toEqual(false);
        });

        it('should recieve answer when it listen all recievers',function() {
            r1.reset();
            r1.add("msg", false);
            s1.send("msg");
            r1.remove();
            expect(r1.answered).toEqual(true);
            r1.reset();
        });

        it('should recieve answer from one concrete reciever, not from others', function() {
            r1.reset();
            r1.add("msg",s2);
            s1.send("msg");
            expect(r1.answered).toEqual(false);
            r1.reset();
            s2.send("msg");
            expect(r1.answered).toEqual(true);
            r1.remove();
            r1.reset();
        });

        it('should attach and detach listeners properly',function() {
            r1.reset();
            r1.addall();
            s1.send("aaa");
            expect(r1.answered).toEqual(true);
            r1.reset();
            s1.send("bbb");
            expect(r1.answered).toEqual(true);
            r1.reset();
            r1.removeall();
            s1.send("aaa");
            expect(r1.answered).toEqual(false);
        });
    });

    describe('testing the proper listeners unattaching', function() {
        it('should remove listener',function() {
            r1.reset();
            r1.add("msg", false);
            r1.remove();
            s1.send("msg");
            expect(r1.answered).toEqual(false);
            r1.reset();
        });

        it('should remove only registered listener',function() {
            r1.reset();
            r1.add("msg",s2);
            expect(function(){r1.removeBad()}).toThrow();
            //r1.removeBad()
            r1.reset();
        });

        it('should remove listener from concrete reciever', function(){
            r1.reset();
            r1.add("msg",s2);
            s2.send("msg");
            expect(r1.answered).toEqual(true);
            r1.remove();
            r1.reset();
            s2.send("msg");
            expect(r1.answered).toEqual(false);
            r1.reset();
        });
    });

    it('should send message with data',function(){
        d1.resetWithData();
        d1.addWithData("extra",d1);
        d1.sendWithData("extra",{item:1});
        expect(d1.data).toEqual(1);
        d1.resetWithData();
        d1.sendWithData("extra",{item:2});
        expect(d1.data).not.toEqual(1);
    });


    describe('adding multiple signals together', function(){
        it('should recieve one of multiple signals',function() {
            r1.reset();
            r1.add("fake msg", false);
            s1.send("msg");
            r1.remove();
            expect(r1.answered).toEqual(true);
            r1.reset();
        });

        it('should recieve one of multiple signals from one concrete reciever', function() {
            r1.reset();
            r1.add("fake msg",s2);
            s1.send("msg");
            expect(r1.answered).toEqual(false);
            r1.reset();
            s2.send("msg");
            expect(r1.answered).toEqual(true);
            r1.remove();
            r1.reset();
        });

        it('should detach multiple listeners properly',function() {
            r1.reset();
            r1.add("fake msg", false);
            r1.remove();
            s1.send("msg");
            expect(r1.answered).toEqual(false);
            r1.reset();
        });
    });
		
});
