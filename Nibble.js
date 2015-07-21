//boolean to signify game changes
var play;
var gameOver;
var pause;
var resetting;

//animation
var animate=window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
			function(callback){
				window.setTimeout(callback, 1000/60);
			};
var animationId;

//canvas element
var canvas = document.createElement ('canvas');
var WIDTH = window.innerWidth ;
var HEIGHT = window.innerHeight;
canvas.width = WIDTH;
canvas.height = HEIGHT;

//audio
var music = new Audio ("LifeofRiley.mp3");
music.volume=0.05;
music.loop=true;
music.play();

//create button objects
var gameover_icon;
var gameover_scale;
var pause_icon;
var mainMenu;
var images=[];

//context
var context = canvas.getContext('2d');

//mouse location
var mouseX;
var mouseY;
var left;
var right;
var DRAG = 0.03;

//background color(hexvalue) and decimal value 
var colorPercent;
var backgroundColor;
var whiten;

//food min and max size values and array to store all food objects
var allFood = [];
var foodCounter;
var timeoutID = [];
var MAX_FOOD_LENGTH=0; //will be set in function
var MIN_FOOD_LENGTH=0;//will be set in function 

//player object and images send to player object
var player;
var score; //score increases according to length of food eaten
var interval; //the interval at which food drops down
var fish_images=[];

//levels
var LEVELS = [200, 500, 1000, 2000, 4000];
var LEVEL_COUNT=0;


//img element
var loadImage = function (src, scale, callback){
	var image = document.createElement ('img');
	image.onload = function(){
		image.width*=scale;
		image.height*=scale;
		callback(image);
	}
	image.src=src;
	return image;
}

//main menu called at the beginning of the game
var MainMenu = function (images){
	this.play = images[0];
	this.help =images[1];
	this.settings =images[2];
	this.title=images[3];
	this.play_scale=0.5;
	this.help_scale=0.3;
	this.settings_scale=0.3;
	this.x=WIDTH/2;
	this.y=HEIGHT/2;
}

MainMenu.prototype.update =function (){
	this.play.width=this.play.naturalWidth*this.play_scale;
	this.help.width=this.help.naturalWidth*this.help_scale;
	this.settings.width=this.settings.naturalWidth*this.settings_scale;
	this.play.height=this.play.naturalHeight*this.play_scale;
	this.help.height=this.help.naturalHeight*this.help_scale;
	this.settings.height=this.settings.naturalHeight*this.settings_scale;

	if(mouseY<this.y+this.play.height/2+50  && mouseY>this.y-this.play.height/2-50){
		if(mouseX<this.x+this.play.width/2+50 && mouseX>this.x-this.play.width/2-50 ){
			this.play.width=this.play.naturalWidth;
			this.play.height=this.play.naturalHeight;
		}
	}
	if(mouseY<HEIGHT-100 && mouseY>HEIGHT-this.help.height-210){
		if(mouseX<WIDTH && mouseX>WIDTH-this.settings.width-110){
			this.settings.width*=1.5;
			this.settings.height*=1.5;
		}
		if (mouseX<WIDTH-this.settings.width-110 && mouseX>WIDTH-2*this.help.width-160){
			this.help.width*=1.5;
			this.help.height*=1.5;
		}
	}
	
	
}

MainMenu.prototype.render = function(){
	context.save();
	context.translate(this.x, this.y);
	context.drawImage(this.title, -this.title.width/2, -this.title.height/2-this.title.height-100);
	context.drawImage(this.play, -this.play.width/2, -this.play.height/2, this.play.width, this.play.height);
	context.drawImage(this.help, WIDTH/2-2*this.help.width-150, HEIGHT/2-this.help.height-100, this.help.width, this.help.height);
	context.drawImage(this.settings, WIDTH/2-this.settings.width-100, HEIGHT/2-this.settings.height-100, this.settings.width, this.settings.height);
	context.restore();
}

//player function
var Player = function (images){
	this.image1=images[0];
	this.image2=images[1];
	this.image3=images[2];
	this.image4=images[3];
	this.image = this.image1;
	this.nearFood=false;
	this.scale=1;
	this.width=this.image.width;
	this.height=this.image.height;
	this.origWidth=this.image.width;
	this.origHeight=this.image.height;
	this.score = 0;
	this.x = WIDTH/2;
	this.y= HEIGHT/2;
	this.angle = 0;
}

Player.prototype.update = function (){
	this.nearFood = false;
	this.width=this.origWidth*this.scale;
	this.height=this.origWidth*this.scale;
	this.x += ((mouseX-this.x)*DRAG);
	this.y += ((mouseY-this.y)*DRAG);
	this.angle = Math.atan((this.y-mouseY)/(this.x-mouseX));

	left =false;
	right = false;
	if(mouseX>this.x) left = true;
	else right = true;

	var distance = 0;

	for(var i=0; i<allFood.length; i++){
		var food = allFood [i];
		distance = Math.sqrt((food.x-this.x)*(food.x-this.x)+(food.y-this.y)*(food.y-this.y));
		if(food.canEat){
			if(distance<=this.height/2){
				score+=parseInt(food.length);
				allFood.splice(i, 1);
				this.scale+=0.002;
			} 
			else if(distance<=(this.width+food.length)/2+50){
				this.nearFood=true;
				break;
			}
		}
		else if(distance<=(this.height+food.length)/2){
			gameOver=true;
		} 
	}

	if(left && this.nearFood) this.image = this.image4;
	else if (right && this.nearFood) this.image = this.image3;
	else if (left) this.image = this.image2;
	else this.image = this.image1;
}

Player.prototype.render = function (){
	context.save();
	context.translate (this.x, this.y);
	context.rotate(this.angle);
	context.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
	context.restore();
}

//food for now this is in the shape of a square which is rotating
var Food = function (x, speed, side_length, color, eat){
	this.canEat = eat;
	this.x=x;
	this.y=0;
	this.speed = speed;
	this.length = side_length;
	this.color = color;
	this.angle = 0;
	this.addAngle = function (x){
		this.angle += x;
		if(this.angle>(2*Math.PI)) this.angle -= (2*Math.PI); 
	}
}

Food.prototype.update=function (){
	this.addAngle(0.2);
	this.y+=this.speed;
	if(this.length<=player.width*0.4) this.canEat=true;
}

Food.prototype.render= function (){
	context.save ();
	context.translate(this.x, this.y);
	context.rotate(this.angle);
	context.beginPath();
	if (this.canEat){
		context.lineWidth="2";
		context.strokeStyle=this.color;
		context.rect(-this.length/2, -this.length/2, this.length, this.length);
		context.stroke();
	}
	else{
		context.fillStyle=this.color;
		context.fillRect(-this.length/2, -this.length/2, this.length, this.length);	
	} 
	context.restore();
}


//adds food to the tank
var addFood = function (){
	var length = parseInt(Math.random() * (MAX_FOOD_LENGTH-MIN_FOOD_LENGTH+1)) + MIN_FOOD_LENGTH;
	var eat=(length<=player.width*0.4)?true:false;
	var x = parseInt(Math.random() * WIDTH);
	var speed = parseInt(Math.random()*8) +1;
	var color = randomColor ();
	if(!pause && !gameOver) allFood.push(new Food(x, speed, length, color, eat));
	if(!resetting){
		timeoutID.push(setTimeout(addFood, interval));
		if(timeoutID.length>1000) timeoutID.splice(0, timeoutID.length-101);
	} 	

}

//shifts the color of the background from light blue to dark blue to signify change from day to night
//automatically is called every 5 seconds, when it is day time and every 3 seconds during dark
var setBackgroundColor = function (){
	if(whiten) colorPercent+=10;
	else colorPercent-=5;
	if(colorPercent<0) whiten = true;
	if (colorPercent > 500) whiten = false;
	backgroundColor=colorShift(20, 20, 102, colorPercent);
	if(play && !gameOver) setTimeout(setBackgroundColor, 2000);

}

var colorShift = function (r, g, b, percent){
	r = parseInt(r*(1+percent/100));
	g = parseInt(g*(1+percent/100));
	b= parseInt(b*(1+percent/100));

	r=((r<255)?r:255).toString(16);
	g=((g<255)?g:255).toString(16);
	b=((b<255)?b:255).toString(16);

	var rr=(r.length==1)?"0"+r:r;
	var gg=(g.length==1)?"0"+g:g;
	var bb=(b.length==1)?"0"+b:b;

	return ("#"+rr+gg+bb).toUpperCase();
}


//returns a random color using rgb values 
function randomColor (){
	var color = "rgb(";
	for(var i=0; i<2; i++){
		color+=""+Math.floor(255-parseInt(Math.random()*10)*25.5);
		color+=",";
	}
	color+="0)";
	return color;
}

//returns a promise containing async operation loadImage
var getImage = function (image, scale){
	return new Promise (function (resolve, reject){
		loadImage(image, scale, function(image){
			resolve(image);
		});
	});
} 

//returns a promise containing async operation window.onload
function loadWindow(){
	return new Promise (function(resolve, reject){
		window.onload = function(){
			document.body.appendChild(canvas);
			resolve();
		}
	});
}

//chains promises
//make sure winow.onload is first because, window is only loaded once
loadWindow().then(function(image){
	return getImage("play.png", 0.5);
}).then(function(image){
	images.push(image);
	return getImage("help.png", 0.3);
}).then(function(image){
	images.push(image);
	return getImage("settings.png", 0.3);
}).then(function (image){
	images.push(image);
	return getImage("title.png", 1);
}).then(function(image){
	images.push(image);
	return getImage("pause.png", 0.1);
}).then(function (image){
	pause_icon=image;
	return getImage("gameover.png", 0.2);
}).then(function(image){
	gameover_icon=image;
	return getImage("Fish1.png", 0.05);
}).then(function(image){
	fish_images.push(image);
	return getImage("Fish2.png", 0.05);
}).then(function(image){
	fish_images.push(image);
	return getImage("Fish3.png", 0.05);
}).then(function(image){
	fish_images.push(image);
	return getImage("Fish4.png", 0.05);
}).then(function(image){
	fish_images.push(image);
	start(false);
	animationId=animate(step);
}).catch(function(){
	console.log("error");
});   

//called after async operations to load images and window are resolved
//starts window operations
function init (p){
	score=0;
	interval=100;
	foodCounter=0;
	play=p;
	gameOver=false;
	pause=false;
	left=true;
	right=false;
	mouseX=WIDTH/2;
	mouseY=HEIGHT/2;
	colorPercent=200;
	whiten=false;
	gameover_icon.width=gameover_icon.naturalWidth*0.2;
	gameover_icon.height=gameover_icon.naturalHeight*0.2;
	gameover_scale=0.2;
	setBackgroundColor();
	mainMenu=new MainMenu (images);
	player=new Player(fish_images);
	MAX_FOOD_LENGTH=player.width*0.8;
	MIN_FOOD_LENGTH = player.width * 0.05; 
	resetting=false;
	if(play){
		addFood();
	}
	else{
		for(var i=0; i<5; i++){
			addFood();
		}
	}
	
}

//called when play button is clicked
function start (p){
	resetting=true;
	foodCounter=0;
	for(var i=timeoutID.length-1; i>=0 && i>=timeoutID.length-100; i--){
		clearTimeout(timeoutID[i]);
	}
	reset(p);
}

//resets everything and goes to main menu
//called when gameover
function reset (p){
	allFood=[];
	init(p);
}

//animation is done
var step  = function (){
	if(!resetting){
		update ();
		render ();
	}
	animationId = animate (step);
}


//update and render functions
function update (){
	//if its not gameover update food
	if (!pause && !gameOver){
		MAX_FOOD_LENGTH=player.width*0.8;
		MIN_FOOD_LENGTH = player.width * 0.05;
		for (var i=0; i<allFood.length; i++){
			allFood[i].update();
		}
		for(var i=0; i<allFood.length; i++){
			if(allFood[i].y>HEIGHT) allFood.splice(i, 1);
		}		
	}

	//if playing update fish 
	if(!pause && play && !gameOver){
		player.update();
		pause_icon.width=pause_icon.naturalWidth*0.1;
		pause_icon.height=pause_icon.naturalHeight*0.1;
		if(mouseX>0 && mouseX<pause_icon.width*0.1+40 && mouseY>0 && mouseY<pause_icon.height*0.1+40){
			pause_icon.width*=1.5;
			pause_icon.height*=1.5;
		}
		if(LEVEL_COUNT!=5 && score>LEVELS[LEVEL_COUNT]){
			addFood();
			LEVEL_COUNT++;
		}

	}
	else if(!gameOver){
		mainMenu.update();
	}
	
}

function render (){
	context.clearRect(0, 0, WIDTH, HEIGHT);
	context.fillStyle = backgroundColor;
	context.fillRect(0, 0, WIDTH, HEIGHT);
	if(play || gameOver){
		for (var i=0; i<allFood.length; i++){
			allFood[i].render();
		}
		player.render();
		context.font ="40px serif";
		context.strokeText(score, WIDTH-200, 100);
		context.drawImage(pause_icon, 10, 10, pause_icon.width, pause_icon.height);
		if(gameOver){
			context.drawImage(gameover_icon, (WIDTH-gameover_icon.width)/2, (HEIGHT-gameover_icon.height)/2, gameover_icon.width, gameover_icon.height);
			gameover_icon.width=gameover_icon.naturalWidth*gameover_scale;
			gameover_icon.height=gameover_icon.naturalHeight*gameover_scale;
			gameover_scale+=0.005;
			if(gameover_icon.width>WIDTH) start(false);
		} 
	}
	else if(!gameOver){
		for (var i=0; i<allFood.length; i++){
			allFood[i].render();
		}
		mainMenu.render();
	}
}

//mouse listener
window.addEventListener("mousemove", function (e){
	mouseX = e.clientX;
	mouseY = e.clientY;
});

window.addEventListener("click", function (){
	if(!play && !gameOver){
		if(mainMenu.play.width!=mainMenu.play.naturalWidth*mainMenu.play_scale){
			start(true);
		}
		if(mainMenu.help.width!=mainMenu.help.naturalWidth*mainMenu.help_scale){

		}
		if(mainMenu.settings.width==mainMenu.settings.naturalWidth*mainMenu.settings_scale){

		}
	}
	if(play && !gameOver){
		if(pause_icon.width!=pause_icon.naturalWidth*0.1){
			pause=(pause)?false:true;
		} 
	}
});