var GameState = function(game){};

var stageSize = {width:1136, height:640};
var centerPoint = {x:stageSize.width/2, y:stageSize.height/2};

GameState.prototype.preload = function() {
 //We're preloading all the assets for the game to avoid any potential load-lag later.
    this.game.load.image('player', 'assets/plane.png');
    this.game.load.image('blimp', 'assets/blimp.png');
};

GameState.prototype.create = function() {
    //This is called immediately after preloading.

    this.game.stage.backgroundColor = 0x4488cc;

    this.game.physics.arcade.gravity.y = 100;

    //Here we add an Player object to the stage. This is constructed using a prototype as defined below.
    this.game.add.existing(
        this.player = new Player(this.game, 150, centerPoint.y, this.game.input)
    );

    //Just for good measure, i've added an fps timer.
    this.game.time.advancedTiming = true;
    this.fpsText = this.game.add.text(
        20, 20, '', { font: '16px Arial', fill: '#ffffff' }
    );

    this.textGroup = game.add.group();



    this.blimpGroup = game.add.group();
		this.blimpTimer = game.time.events.loop(Phaser.Timer.SECOND*2.5, function(){
		    var blimp = this.game.add.existing(
		        new Blimp(this, this.player)
		    );
		    this.blimpGroup.add(blimp);
		}, this);
}

GameState.prototype.update = function() {
    //This method is called every frame.
    //We're not doing anything but updating the fps here.
    if (this.game.time.fps !== 0) {
        this.fpsText.setText(this.game.time.fps + ' FPS');
    }
    if(this.player.health <= 0){
		    //We pass in the player, blimpgroup, and blimptimer in order to remove them
		    gameOver(this.player, this.blimpGroup, this.blimpTimer);
		}
		if(this.textGroup.children.length < 20) {
			this.addNewLetter();
			console.log(this.textGroup);
		}
		for (var i=0; i < this.textGroup.children.length; i++) {
			var letter = this.textGroup.children[i];
			letter.vy += letter.ay * this.game.time.physicsElapsed;
      letter.y += letter.vy + this.game.time.physicsElapsed;
		}
		for (var i=0; i < this.textGroup.children.length; i++) {
			var letter = this.textGroup.children[i];
			if (letter.y > stageSize.height) {
				this.textGroup.remove(letter);
			}
		}

}

var Player = function(game, x, y, target){
    //Here's where we create our player sprite.
    Phaser.Sprite.call(this, game, x, y, 'player');
    //We set the game input as the target
    this.target = target;
    //The anchor is the 'center point' of the sprite. 0.5, 0.5 means it will be aligned and rotated by its center point.
    this.anchor.setTo(0.5, 0.5);
    //Finally we enable physics so we can move the player around (this is how easy physics is in Phaser)
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    //We need a target position for our player to head to
    this.targetPos = {x:this.x, y:this.y};
    //And an easing constant to smooth the movement
    this.easer = .5;
    //Health
    this.health = 100;

    //We need a target position for our player to head to
		this.targetPos = {x:this.x, y:this.y};
		//And an easing constant to smooth the movement
		this.easer = .5;
}

var Blimp = function(game, player){

    //Give the blimp an x offscreen, a random y, and a speed between -150 and -250
    var x = stageSize.width+200;
    var y = Math.random()*stageSize.height;
    this.speed = -250-Math.random()*150;
    this.player = player;

    //Create a sprite with the blimp graphic
    Phaser.Sprite.call(this, game, x, y, 'blimp');

    //Again, enable physics and set velocity
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.velocity.setTo(this.speed, 0);

    //Set a scale between 1 and 1.5 for some random sizes
    this.scale.setTo(1+Math.random()*3);
    this.anchor.setTo(0.5, 0.5);

    //This handy event lets us check if the blimp is completely off screen. If it is, we call blimpOutOfBounds, and get rid of it.
    this.checkWorldBounds = true;
    this.events.onOutOfBounds.add(blimpOutOfBounds, this);

    //Whether the blimp has been hit by the player yet.
    this.hit = false;
}

GameState.prototype.addNewLetter = function() {
  var myletter = this.game.add.text(Math.random()*stageSize.width, Math.random()*stageSize.height, Math.random().toString(36).toString(36).replace(/[^a-z]+/g, '').substring(0, 1), { font: '16px Arial', fill: '#ffffff' });

  myletter.enableBody = true;
  //Again, enable physics and set velocity
  myletter.speed = -150-Math.random()*150;

  //Set a scale between 1 and 1.5 for some random sizes
  myletter.scale.setTo(1+Math.random()*2);
  myletter.anchor.setTo(0.5, 0.5);

  //This handy event lets us check if the blimp is completely off screen. If it is, we call blimpOutOfBounds, and get rid of it.
  myletter.checkWorldBounds = true;
  myletter.events.onOutOfBounds.add(letterOutOfBounds, myletter);

  //Whether the blimp has been hit by the player yet.
  myletter.hit = false;
  myletter.interactive = true;
  myletter.vy = 1;
  myletter.ay = 1.5;
	this.textGroup.add(myletter);
}

function letterOutOfBounds(letter) {
		console.log("AAA");
		//letter.kill();
}

function blimpOutOfBounds(blimp){
    blimp.kill();
}

Blimp.prototype = Object.create(Phaser.Sprite.prototype);
Blimp.prototype.constructor = Blimp;

Blimp.prototype.update = function(){

    //As a simple form of hit detection (Phaser also supports pixel perfect HD, but i'll keep it simple) we'll detect the bounds and see if they intersect.
    var boundsA = this.player.getBounds();
    var boundsB = this.getBounds();

    //If the bounds intersect and it's not already hit.
    if(Phaser.Rectangle.intersects(boundsA, boundsB) && !this.hit){
        this.hit = true;

        //Detract 20 from the players health and set the alpha to represent it.
        this.player.health -= 20;
        this.player.alpha = this.player.health/100;
        console.log(this.player.health);

        //Change the velocity to a downwards fall
        this.body.velocity.setTo(this.body.velocity.x/2, 100);

        //Phaser also lets you use Tweens to easily smooth movement. Here i've smoothly rotated downwards to give the impression of falling.
        game.add.tween(this)
        .to({rotation: -Math.PI/8}, 300, Phaser.Easing.Linear.In)
        .start();
    }
}

//We give our player a type of Phaser.Sprite and assign it's constructor method.
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function(){

    //If the target's (which we have assigned as this.game.input) active pointer is down
    if (this.target.activePointer.isDown){
        //Make our new target position the pointers position
        this.targetPos = {x:this.target.x, y:this.target.y};
    }

    //Now work out the velocities by working out the difference between the target and the current position, and use an easer to smooth it.
    var velX = (this.targetPos.x-this.x)/this.easer;
    var velY = (this.targetPos.y-this.y)/this.easer;

    //Set the Players physics body's velocity
    this.body.velocity.setTo(velX, velY);

}

function gameOver(player, blimpGroup, blimpTimer){

    //Destroy the group of blimps
    blimpGroup.destroy();
    //Kill the player
    player.kill();
    //Remove the timer
    game.time.events.remove(blimpTimer);

    //Create some GAME OVER text using a text style. Set the anchor to 0.5, 0.5 so it's perfectly centered.
    var textStyle = {font:"28px Arial", fill: "#FFFFFF", align:"center"};
    game.add.text(game.world.centerX, game.world.centerY, 'GAME OVER MAN. GAME OVER.\nCLICK TO PLAY AGAIN', textStyle)
    .anchor.setTo(0.5, 0.5);

    //We want the player to be able to restart, so add an click event.
    game.input.onDown.addOnce(newGame, this);

}

function newGame(){
    //This sets the state of your game to a fresh version of GameState, starting it all over again.
    game.state.add('game', GameState, true);
}


var game = new Phaser.Game(stageSize.width, stageSize.height, Phaser.AUTO, 'game');
game.state.add('game', GameState, true);