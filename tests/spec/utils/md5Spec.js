describe('Geometry', function(){
	var v1, 
        v2,
        eps = 1e-5;
    	
	beforeEach(function(){
    	v1 = new JAK.Vec2d(1,1);
    	v2 = new JAK.Vec2d(2,-1);
	});
	
	it('should return 1 for v1.x', function() {
		expect(v1.getX()).toEqual(1);
	});
	
	it('should return -1 for v2.y', function(){
		expect(v2.getY()).toEqual(-1);
	});
	
	it('should serialize 2d vector', function() {
		expect(v2.join(",")).toEqual("2,-1");
	});
	
	it('should compute vector norm', function(){
		expect(v2.norm()).toEqual(Math.sqrt(5));
	});
	
	it('should compute scalar multiply of two vectors', function() { 
		expect(v2.dot(v2.normal())).toEqual(0);
	});
	
	it('should compute symetry', function() {
		expect(Math.abs(v2.symmetry(v1).getX() + 1)).toBeLessThan(eps);
		expect(Math.abs(v2.symmetry(v1).getY() - 2)).toBeLessThan(eps);
	});
	                                                            
	it('should compute distance between two points', function() {
		expect(Math.abs(v1.distance(new JAK.Vec2d(-1,1), new JAK.Vec2d(1,-1)) + Math.sqrt(2))).toBeLessThan(eps);
	});

});