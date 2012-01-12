// JAk eXtended
// Josef Vanžura
JAX = {
	version: "DEVEL",
	DECORATE_ONDEMAND: false,
	DEBUG: false,
	METHOD_BOTH: 1,
	METHOD_SINGLE: 2,
	_uid: 0
};

JAX.subProc = function(func){
	return setTimeout(func,1);
}

JAX.hash = function(value){
	var result = 0;
	var value = (""+value);
	for( var i = 0; i < value.length; i++ ){
		result += value.charCodeAt(i)*(10*i*i);
	}
	return result.toString(16);
}

JAX.Delay = function(func,time){
	this.args = [];
	if( arguments.length > 2 ){
		for( var i = 2; i < arguments.length; i ++){
			this.args.push(arguments[i]);
		}
		this.cycle = this._cycle.bind(this);
		this.func = func;
		this.timer = setTimeout(this.cycle,time);
	} else {
		this.timer = setTimeout(func,time);
	}
};

JAX.Delay.prototype._cycle = function(){
	this.func.apply(this.func,this.args);
}

JAX.Delay.prototype.stop = function(){
	clearTimeout(this.timer);
}

JAX.Interval = function(func,time){
	this.args = [];
	if( arguments.length > 2 ){
		for( var i = 2; i < arguments.length; i ++){
			this.args.push(arguments[i]);
		}
		this.cycle = this._cycle.bind(this);
		this.func = func;
		this.timer = setInterval(this.cycle,time);
	} else {
		this.timer = setInterval(func,time);
	}
};

JAX.Interval.prototype._cycle = function(){
	this.func.apply(this.func,this.args);
}

JAX.Interval.prototype.stop = function(){
	clearInterval(this.timer);
}

JAX.IntervalCheck = function(checkfunc,callback,interval,timeout){
	this.checkfunc = checkfunc;
	this.callback = callback;
	this._interval = interval || 100;
	this._time = 0;
	this._timeout = timeout || -1;
	this.interval = new JAX.Interval(this.check.bind(this),this._interval);
}

JAX.IntervalCheck.prototype.check = function(){
	if(this.checkfunc()){
		this.callback(true);
		this.stop();
	}
	if(this._timeout != -1){
		this._time += this._interval;
		if(this._time >= this._timeout){
			this.callback(false);
			this.stop();
		}
	}
}

JAX.IntervalCheck.prototype.stop = function(){
	this.interval.stop();
}
