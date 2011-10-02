describe("ISignals interface", function(){
	var s1,s2,r1,grr,
        dummy = JAK.ClassMaker.makeClass({
            NAME:"dummy",
            IMPLEMENT:JAK.ISignals,
            CLASS:"class"
        });
	dummy.prototype.$constructor = function() {
		this.reset();
	};
	dummy.prototype.reset = function() {
		this.answered = false;
	};
	dummy.prototype.answer = function() {
		this.answered = true;
	};
	dummy.prototype.add = function(name,sender) {
		var id = this.addListener(name,"answer",sender);
		if (id) { this.id = id; }
		return id;
	};
	dummy.prototype.remove = function() {
		this.removeListener(this.id);
	};
	dummy.prototype.removeBad = function() {
		this.removeListener("salala");
	};
	dummy.prototype.send = function(name) {
		this.makeEvent(name);
	};
		

	var test = JAK.ClassMaker.makeClass({
		NAME:"test",
		IMPLEMENT:JAK.ISignals,
		CLASS:"class"
	});

	test.prototype.$constructor = function(len) {
		this.ec = [];
		this.len = len;
		for(var i = 0; i < len; i++) {
			var fnc = this.callback.bind(this);
			this.ec.push(this.addListener("anything",fnc));
		}
	}

	test.prototype.callback = function(data){

	}

	test.prototype.remove = function() {
		this.removeListeners(this.ec);
	}


	/**
	 * pri spusteni testu
	 */		 		
	beforeEach(function() {
		s1 = new dummy();
		s2 = new dummy();
		r1 = new dummy();
		grr = new test(4);
	});
	
	afterEach(function(){
        s1 = s2 = r1 = grr = null;
    });
		
	describe("basic tests", function(){
		it("should not be listen", function() {
			r1.reset();
			expect(r1.answered).toEqual(false);
		});

		it("should listen all recievers", function() {
			r1.reset();
			r1.add("msg",false);
			s1.send("msg");
			r1.remove();
			expect(r1.answered).toEqual(true);
			r1.reset();
		});
		
		it("should remove listener", function() {
			r1.reset();
			r1.add("msg",false);
			r1.remove();
			s1.send("msg");
			expect(r1.answered).toEqual(false);
			r1.reset();
		});
    });
		
    describe("advanced tests", function() {
		it("should listen concrete listener not others",function() {
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

		it("should unregister concrete listener",function() {
			r1.reset();
			r1.add("msg",s1);
			try {
				r1.removeBad();
				//fail("Odvěšení neexistujícího");
				//TODO: exception matcher
				expect(true).toEqual(false);
			} catch (e) {
			}
			s1.send("msg");
			//'Odvěšení konkrétního - špatné'
			expect(r1.answered).toEqual(true);
			r1.reset();
			r1.remove();
			s1.send("msg");
			//'Odvěšení konkrétního - správné'
			expect(r1.answered).toEqual(false);
			r1.reset();
		});
		
		it("should add listener only once",function() {
			r1.reset();
			expect(r1.add("msg",s1)).not.toEqual(null);
			expect(r1.add("msg",s1)).toEqual(null);
			r1.remove();
			r1.reset();
		});


	    it("should remove all listeners by list of IDs", function() {
		    var len = grr.len;
			var start = grr.ec.length;
			grr.remove();
			var end = grr.ec.length;
			var handled = (len == start);
			var unhandled = !end;

			expect(handled).toEqual(true);
			expect(unhandled).toEqual(true);
	    });

    });
});