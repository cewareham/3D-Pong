class Game {
    constructor() {
        this.ballDirX = 1;
        this.ballDirY = 1;
        this.ballSpeed = 2;
        this.paddle1DirY = 0;
        this.paddle2DirY = 0;
        this.paddleSpeed = 3;
        // set opponent reflexes (0 - easiest, 1 - hardest)
        this.difficulty = 0.15;
        this.score1 = 0
        this.score2 = 0;
        this.maxScore = 7;  // can change to any positive whole number

        this.setup();
        this.draw();
    }

    setup = () => {
        // update the board to reflect the max score for match win
    	document.getElementById("winnerBoard").innerHTML = "First to " + this.maxScore + " wins!";

        const WIDTH = 640,
              HEIGHT = 360;
        // create WebGL renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(WIDTH, HEIGHT);
        this.canvas = document.getElementById('gameCanvas')
        this.canvas.appendChild(this.renderer.domElement);

        // Set some camera attributes.
        const VIEW_ANGLE = 45;
        const ASPECT = WIDTH / HEIGHT;
        const NEAR = 0.1;
        const FAR = 10000;

        // create camera & scene
        this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        this.scene = new THREE.Scene();
        this.scene.add(this.camera);
        // set default camera position, not doing messes up shadow rendering
        this.camera.position.z = 320;

        this.fieldWidth = 400;
        this.fieldHeight = 200;
        let planeWidth = this.fieldWidth,
            planeHeight = this.fieldHeight,
            planeQuality = 10;
        
        // create playing surface plane
        let plane = new THREE.Mesh(
            // 95% of table width, since want to show where ball goes out-of-bounds
            new THREE.PlaneGeometry(planeWidth * 0.95, planeHeight, planeQuality, planeQuality),
            new THREE.MeshLambertMaterial({color: 0x48d121})
        );
        this.scene.add(plane);
        plane.receiveShadow = true;

        let table = new THREE.Mesh(
            new THREE.CubeGeometry(planeWidth*1.05, planeHeight*1.03, 100, planeQuality, planeQuality, 1),
            new THREE.MeshLambertMaterial({color: 0x111111})
        );
        table.position.z = -51;
        this.scene.add(table);
        table.receiveShadow = true;

        // create sphere
        this.radius = 5;
        this.segments = 6;
        this.rings = 6;

        this.ball = new THREE.Mesh(
            new THREE.SphereGeometry(this.radius, this.segments, this.rings),
            new THREE.MeshLambertMaterial( {color: 0xd43001} )
        );
        this.scene.add(this.ball);
        this.ball.position.x = 0;
        this.ball.position.y = 0;
        // set ball above table surface
        this.ball.position.z = this.radius;
        this.ball.receiveShadow = true;
        this.ball.castShadow = true;

        // create paddles
        this.paddleWidth = 10;
        this.paddleHeight = 30;
        this.paddleDepth = 10;
        this.paddleQuality = 1;
        
        this.paddle1 = new THREE.Mesh(
            new THREE.CubeGeometry(this.paddleWidth, this.paddleHeight, this.paddleDepth, this.paddleQuality, this.paddleQuality, this.paddleQuality),
            new THREE.MeshLambertMaterial({color: 0x1B32C0})
        );
        this.scene.add(this.paddle1);
        this.paddle1.receiveShadow = true;
        this.paddle1.castShadow = true;

        this.paddle2 = new THREE.Mesh(
            new THREE.CubeGeometry(this.paddleWidth, this.paddleHeight, this.paddleDepth, this.paddleQuality, this.paddleQuality, this.paddleQuality),
            new THREE.MeshLambertMaterial({color: 0xFF4045})
        );
        this.scene.add(this.paddle2);
        this.paddle2.receiveShadow = true;
        this.paddle2.castShadow = true;

        // set paddles on each side of table
        this.paddle1.position.x = -this.fieldWidth/2 + this.paddleWidth;
        this.paddle2.position.x = this.fieldWidth/2 - this.paddleWidth;
        // lift paddles over playing surface
        this.paddle1.position.z = this.paddleDepth;
        this.paddle2.position.z = this.paddleDepth;

        // create the pillar's material
        let pillarMaterial = new THREE.MeshLambertMaterial({color: 0x534d0d});

        // iterate 10x (5x each side) to create pillars
        // to show off shadows for pillars on left
        for (let ii=0; ii<5; ii++) {
            let backdrop = new THREE.Mesh(
                new THREE.CubeGeometry(30, 30, 300, 1, 1, 1),
                pillarMaterial
            );
            backdrop.position.x = -50+ii*100
            backdrop.position.y = 230;
            backdrop.position.z = -30;
            backdrop.castShadow = true;
            backdrop.receiveShadow = true;
            this.scene.add(backdrop);
        }

        // iterate 10x (5x each side) to create pillars
        // to show off shadows for pillars on right
        for (let ii=0; ii<5; ii++) {
            let backdrop = new THREE.Mesh(
                new THREE.CubeGeometry(30, 30, 300, 1, 1, 1),
                pillarMaterial
            );
            backdrop.position.x = -50+ii*100
            backdrop.position.y = -230;
            backdrop.position.z = -30;
            backdrop.castShadow = true;
            backdrop.receiveShadow = true;
            this.scene.add(backdrop);
        }

        // finish with ground plane to show off shadows
        // create the ground's material
        let groundMaterial = new THREE.MeshLambertMaterial({color: 0x888888});
        let ground = new THREE.Mesh(
            new THREE.CubeGeometry(1000, 1000, 3, 1, 1, 1),
            groundMaterial
        );
        ground.position.z = -132;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // create point light
        let pointLight = new THREE.PointLight(0xf8d898);
        pointLight.position.set(-1000, 0, 1000);
        pointLight.intensity = 2.9;
        pointLight.distance = 10000;
        this.scene.add(pointLight);

        // add spot light - important for casting shadows
        this.spotLight = new THREE.SpotLight(0xf8d898);
        this.spotLight.position.set(0, 0, 460);
        this.spotLight.intensity = 1.5;
        this.spotLight.castShadow = true;
        this.scene.add(this.spotLight);
    
        // MAGIC SHADOW CREATOR DELUXE EDITION with Lights PackTM DLC
	    this.renderer.shadowMapEnabled = true;		
        //console.log("Game->setup()");
    }

    updateBall = () => {
        // if ball goes off 'left' side (Player's side)
        if (this.ball.position.x <= -this.fieldWidth/2) {
            this.score2++;
            document.getElementById("scores").innerHTML = this.score1 + "-" + this.score2;
            this.resetBall(2);
            this.matchScoreCheck();
            // cpu scores pt, update scoreboard, reset ball
        }
        if (this.ball.position.x >= this.fieldWidth/2) {
            this.score1++;
            document.getElementById("scores").innerHTML = this.score1 + "-" + this.score2;
            this.resetBall(1);
            this.matchScoreCheck();
            // player scores pt, update scoreboard, reset ball
        }
        //console.log(this.ball); 
        this.ball.position.x += this.ballDirX * this.ballSpeed;
        this.ball.position.y += this.ballDirY * this.ballSpeed;
        // limit ball's y-speed to 2x the x-speed
        //  so game remains playable
        if (this.ballDirY > this.ballSpeed*2) this.ballDirY = this.ballSpeed*2;
        else if (this.ballDirY < -this.ballSpeed*2) this.ballDirY = -this.ballSpeed*2;
        // if ball goes off top side (side of table)
        if (this.ball.position.y <= -this.fieldHeight/2/*+this.radius*/) this.ballDirY = -this.ballDirY;
        // if ball goes off bottom side (side of table)
        if (this.ball.position.y >= this.fieldHeight/2/*-this.radius*/) this.ballDirY = -this.ballDirY;
    }

    // resets ball to center of play area &
    // set ball direction speed towards last point winner
    resetBall = (loser) => {
        // position ball in center of table
        this.ball.position.x = this.ball.position.y = 0;
        if (loser == 1) this.ballDirX = -1; // player lost->send ball to opponent
        else this.ballDirX = 1;             // opponent lost->send ball to player
        // set ball to  move +ve in y plane (toward left from camera)
        this.ballDirY = 1;
    }
    
    draw = () => {
        this.updateBall();
        this.checkPaddleCollision();
        this.updateCamera();
        this.updatePlayerPaddle();
        this.updateOpponentPaddle();
        //console.log("Game->draw()");
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.draw);
    }

    xxcheckPaddleCollision()
    {
        // PLAYER PADDLE LOGIC
        
        // if ball is aligned with paddle1 on x plane
        // remember the position is the CENTER of the object
        // we only check between the front and the middle of the paddle (one-way collision)
        if (this.ball.position.x <= this.paddle1.position.x + this.paddleWidth
        &&  this.ball.position.x >= this.paddle1.position.x)
        {
            // and if ball is aligned with paddle1 on y plane
            if (this.ball.position.y <= this.paddle1.position.y + this.paddleHeight/2
            &&  this.ball.position.y >= this.paddle1.position.y - this.paddleHeight/2)
            {
                // and if ball is travelling towards player (-ve direction)
                if (this.ballDirX < 0)
                {
                    // stretch the paddle to indicate a hit
                    this.paddle1.scale.y = 15;
                    // switch direction of ball travel to create bounce
                    this.ballDirX = -this.ballDirX;
                    // we impact ball angle when hitting it
                    // this is not realistic physics, just spices up the gameplay
                    // allows you to 'slice' the ball to beat the opponent
                    this.ballDirY -= this.paddle1DirY * 0.7;
                }
            }
        }
        
        // OPPONENT PADDLE LOGIC	
        
        // if ball is aligned with paddle2 on x plane
        // remember the position is the CENTER of the object
        // we only check between the front and the middle of the paddle (one-way collision)
        if (this.ball.position.x <= this.paddle2.position.x + this.paddleWidth
        &&  this.ball.position.x >= this.paddle2.position.x)
        {
            // and if ball is aligned with paddle2 on y plane
            if (this.ball.position.y <= this.paddle2.position.y + this.paddleHeight/2
            &&  this.ball.position.y >= this.paddle2.position.y - this.paddleHeight/2)
            {
                // and if ball is travelling towards opponent (+ve direction)
                if (this.ballDirX > 0)
                {
                    // stretch the paddle to indicate a hit
                    this.paddle2.scale.y = 15;	
                    // switch direction of ball travel to create bounce
                    this.ballDirX = -this.ballDirX;
                    // we impact ball angle when hitting it
                    // this is not realistic physics, just spices up the gameplay
                    // allows you to 'slice' the ball to beat the opponent
                    this.ballDirY -= this.paddle2DirY * 0.7;
                }
            }
        }
    }
        
    // handle paddle collision logic
    checkPaddleCollision = () => {
        //*** Player paddle ***
    	// if ball is aligned with paddle1 on x plane
        // remember position is CENTER of object
        // we only check between front & middle of paddle (one-way collision)
        let bPos = this.ball.position;
        let p1Pos = this.paddle1.position;
        let p2Pos = this.paddle2.position;
        if (bPos.x <= p1Pos.x+this.paddleWidth && bPos.x >= p1Pos.x) {
             // and ball is aligned with paddle1 on y plane
             if (bPos.y <= p1Pos.y+this.paddleHeight/2 && bPos.y >= p1Pos.y-this.paddleHeight/2) {
                // ball is intersecting with front half of paddle
                // if ball travelling toward player (-ve direction)
                if (this.ballDirX < 0) {
                    this.paddle1.scale.y = 15;          // stretch paddle to show hit
                    this.ballDirX = - this.ballDirX;    // switch ball dir to create bounce
                    // change ball angle when hitting it
                    // allows you to 'slice' ball to beat opponent
                    this.ballDirY -= this.paddle1DirY * 0.7;
                }
            }
        }
        //*** Opponent paddle ***
        if (bPos.x <= p2Pos.x+this.paddleWidth && bPos.x >= p2Pos.x) {
            if (bPos.y <= p2Pos.y+this.paddleHeight/2 && bPos.y >= p2Pos.y-this.paddleHeight/2) {
                if (this.ballDirX > 0) {
                    this.paddle2.scale.y = 15;
                    this.ballDirX = -this.ballDirX;
                    this.ballDirY -= this.paddle2DirY * 0.7;
                }
            }
        }
    }

    updateCamera = () => {
        // we can easily notice shadows if we dynamically move lights during the game
        //this.spotLight.position.x = this.ball.position.x * 2;
        //this.spotLight.position.y = this.ball.position.y * 2;
        
        // move to behind the player's paddle
        this.camera.position.x = this.paddle1.position.x - 100;
        //this.camera.position.y += (this.paddle1.position.y - this.camera.position.y) * 0.05;
        this.camera.position.z = this.paddle1.position.z + 100;// + 0.04 * (-this.ball.position.x + this.paddle1.position.x);
        
        // rotate to face towards the opponent
        //this.camera.rotation.x = -0.01 * (this.ball.position.y) * Math.PI/180;
        this.camera.rotation.y = -60 * Math.PI/180;
        this.camera.rotation.z = -90 * Math.PI/180;
        //this.camera.lookAt(this.paddle2.position);
    }

    // handle CPU paddle movement
    updateOpponentPaddle = () => {
        let bPos = this.ball.position;
        let pPos = this.paddle2.position;
        // lerp toward ball on y plane
        this.paddle2DirY = (bPos.y - pPos.y) * this.difficulty;
        // if lerp function produces value above max paddle speed, clamp it
        if (Math.abs(this.paddle2DirY) <= this.paddleSpeed) pPos.y += this.paddle2DirY;
        else {
            // lerp value too high -> limit speed to paddleSpeed
            // paddle lerping in +ve direction
            if (this.paddle2DirY > this.paddleSpeed) pPos.y += this.paddleSpeed;
            // paddle lerping i -ve direction
            else if (this.paddle2DirY < -this.paddleSpeed) pPos.y -= this.paddleSpeed;
        }
        // lerp scale back to 1 because we stretch paddle at some points
        // stretching is done when paddle touches side of table and when paddle hits ball
        // by doing this here, we ensure paddle always comes back to default size
        this.paddle2.scale.y += (1- this.paddle2.scale.y) * 0.2;
    }

    updatePlayerPaddle = () => {
        // move left
        if (Key.isDown(Key.A) || Key.isDown(Key.LEFT)) {
            console.log("move left");
            // move if paddle not touching side of table
            if (this.paddle1.position.y < this.fieldHeight * 0.45) {
                this.paddle1DirY = this.paddleSpeed * 0.5;
            } else {
                // stretch paddle to indicate we can't move
                this.paddle1DirY = 0;
                this.paddle1.scale.z += (10 - this.paddle1.scale.z) * 0.2;
            }
        } else if (Key.isDown(Key.D) || Key.isDown(Key.RIGHT)) {
            console.log("move right");
            // move if paddle not touching side of table
            if (this.paddle1.position.y > -this.fieldHeight * 0.45) {
                this.paddle1DirY = -this.paddleSpeed * 0.5;
            } else {
                // stretch paddle to show we can't move
                this.paddle1DirY = 0;
                this.paddle1.scale.z += (10 - this.paddle1.scale.z) * 0.2;
            }
        } else {    // don't move paddle
            this.paddle1DirY = 0;
        }
        this.paddle1.scale.y += (1 - this.paddle1.scale.y) * 0.2;
        this.paddle1.scale.z += (1 - this.paddle1.scale.z) * 0.2;
        this.paddle1.position.y += this.paddle1DirY;
    }

    // check if either player has reached this.maxScore
    matchScoreCheck = () => {
        if (this.score1 >= this.maxScore) {
            this.ballSpeed = 0;
            document.getElementById("scores").innerHTML = "Player Wins!";
            document.getElementById("winnerBoard").innerHTML = "Refresh to play again";
        } else if (this.score2 >= this.maxScore) {
            this.ballSpeed = 0;
            document.getElementById("scores").innerHTML = "CPU Wins!";
            document.getElementById("winnerBoard").innerHTML = "Refresh to play again";
        }
    }
}

