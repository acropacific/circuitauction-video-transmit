function neScroller(container, speed, alwaysvisible){
	//container.style.position = 'relative';
	container.style.display = 'block';
	this.list = container.getElementsByTagName('ul')[0];
	this.list.style.position = 'absolute';
	this.list.style.left = '0';
	this.list.style.right = '0';
	this.items = this.list.getElementsByTagName('li');
	this.speed = speed;
	this.paused = false;
	this.distance = this.list.offsetTop;
	if(typeof alwaysvisible !== 'undefined')
		this.alwaysvisible = alwaysvisible;
	else
		this.alwaysvisible = false;
	this.do = function(){
		this.distance--;
		this.list.style.marginTop = this.distance + 'px';
	};
	this.continue = function(){
		if(this.paused){
			return false;
		} else if(this.items[this.items.length-1].offsetTop + this.items[this.items.length-1].offsetHeight + this.list.offsetTop < 0) {
			this.paused = true;
			if(!this.alwaysvisible)
				this.list.parentNode.style.display = 'none';
			return false;
		} else {
			return true;
		}
	};
	this.run = function(){
		this.do();
		if(this.continue()){
			setTimeout(function(self){ return function(){ self.run(); } }(this), this.speed);
		} else {
			//destroyMe
		}
	};
	this.pause = () => {
		this.paused = true;
	};
	this.play = () => {
		this.paused = false;
		this.run();
	};
	this.jump = (index) => {
		this.distance = 0 - this.items[index].offsetTop;
		this.list.style.marginTop = this.distance + 'px';
	}
}