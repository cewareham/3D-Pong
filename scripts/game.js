class Game {
    constructor() {
        this.setup();
        this.draw();
    }

    setup = () => {
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

        let fieldWidth = 400, fieldHeight = 200;
        let planeWidth = fieldWidth,
            planeHeight = fieldHeight,
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
        const radius = 5,
            segments = 6,
            rings = 6;
        let ball = new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, rings),
            new THREE.MeshLambertMaterial( {color: 0xd43001} )
        );
        this.scene.add(ball);
        ball.position.x = 0;
        ball.position.y = 0;
        // set ball above table surface
        ball.position.z = radius;
        ball.receiveShadow = true;
        ball.castShadow = true;

        // create paddles
        let paddleWidth = 10,
            paddleHeight = 30,
            paddleDepth = 10,
            paddleQuality = 1;
        
        let paddle1 = new THREE.Mesh(
            new THREE.CubeGeometry(paddleWidth, paddleHeight, paddleDepth, paddleQuality, paddleQuality, paddleQuality),
            new THREE.MeshLambertMaterial({color: 0x1B32C0})
        );
        this.scene.add(paddle1);
        paddle1.receiveShadow = true;
        paddle1.castShadow = true;

        let paddle2 = new THREE.Mesh(
            new THREE.CubeGeometry(paddleWidth, paddleHeight, paddleDepth, paddleQuality, paddleQuality, paddleQuality),
            new THREE.MeshLambertMaterial({color: 0xFF4045})
        );
        this.scene.add(paddle2);
        paddle2.receiveShadow = true;
        paddle2.castShadow = true;

        // set paddles on each side of table
        paddle1.position.x = -fieldWidth/2 + paddleWidth;
        paddle2.position.x = fieldWidth/2 - paddleWidth;
        // lift paddles over playing surface
        paddle1.position.z = paddleDepth;
        paddle2.position.z = paddleDepth;

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
        let spotLight = new THREE.SpotLight(0xf8d898);
        spotLight.position.set(0, 0, 460);
        spotLight.intensity = 1.5;
        spotLight.castShadow = true;
        this.scene.add(spotLight);
    
        // MAGIC SHADOW CREATOR DELUXE EDITION with Lights PackTM DLC
	    this.renderer.shadowMapEnabled = true;		
        //console.log("Game->setup()");
    }
    
    draw = () => {
        //console.log("Game->draw()");
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.draw);
    }
}
