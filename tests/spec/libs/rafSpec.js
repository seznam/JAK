describe("requestAnimationFrame", function(){
	describe("requesting a frame", function() {
		it("should request an animation frame", function(){
			var done = false;

			runs(function() {
				requestAnimationFrame(function() { done = true; })
				expect(done).toBe(false); /* async! */
			});

			waitsFor(function() {
				return done;
			});

			runs(function() {
				expect(done).toBe(true);
			});
		});

	});

	describe("canceling a frame", function() {
		it("should request an animation frame", function(){
			var done = false;
			var frame = false;

			runs(function() {
				var id = requestAnimationFrame(function() { frame = true; })
				cancelAnimationFrame(id);
				setTimeout(function() {
					done = true;
				}, 300);
			});

			waitsFor(function() {
				return done;
			});

			runs(function() {
				expect(done).toBe(true);
				expect(frame).toBe(false);
			});
		});

	});
});
