class Game {
    constructor() {
        this.setup();
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

        // create sphere
        const radius = 5,
              segments = 6,
              rings = 6;
        let ball = new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, rings),
            new THREE.MeshLambertMaterial( {color: 0xd43001} )
        );
        this.scene.add(ball);

        // create point light
        let pointLight = new THREE.PointLight(0xf8d898);
        pointLight.position.set(-1000, 0, 1000);
        pointLight.intensity = 2.9;
        pointLight.distance = 10000;
        this.scene.add(pointLight);

        //console.log("Game->setup()");
        this.draw();
    }
    
    draw = () => {
        //console.log("Game->draw()");
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.draw);
    }
}
