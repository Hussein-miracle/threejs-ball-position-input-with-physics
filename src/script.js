import * as THREE from "three";
import * as CANNON from "cannon";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import gsap from "gsap";
import "./style.css";

// variables for DOM MANIPULATION
const createBtn = document.getElementById("btn");
const xInput = document.getElementById("inputX");
const yInput = document.getElementById("inputY");
let count = 0;
let mesh = undefined;
let body = undefined;

const objectsToAnimate = [];

/**
 * Debug
 */
const gui = new dat.GUI();
const debugObject = {};

/**
 * Utils
 */
const objectsToUpdate = [];

/**
 * Sounds
 */
const hit = new Audio("/sounds/hit.mp3");

const playHitSound = (collision) => {
  const impactStrength = collision.contact.getImpactVelocityAlongNormal();

  if (impactStrength > 1.5) {
    hit.volume = Math.random();
    hit.currentTime = 0;
    hit.play();
  }
};

const handleAnimation = (arr) => {
  for (const item of arr) {
    const { body } = item;
    const positionX = body.position.x;
    if (positionX !== 0) {
      if (positionX >= 1) {
        body.position.x -= 0.05;
      }

      if (positionX < 0) {
        body.position.x += 0.05;
      }
    }
  }
};

// CONSTANTS
const planeConstants = {
  len: 6.85,
  breath: 6.85,
};

const ballConstants = { size: 0.25, radius: 32 };

// Default material
const defaultMaterial = new CANNON.Material("default");
const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.7,
  }
);

// ball
const ballGeometry = new THREE.SphereBufferGeometry(
  ballConstants.size,
  ballConstants.radius,
  ballConstants.radius
);
const ballMaterial = new THREE.MeshStandardMaterial({
  color: "blue",
});
const shape = new CANNON.Sphere(ballConstants.size);

const createSphere = (position) => {

  if (count >= 1) {
    if (mesh !== undefined) {
      scene.remove(mesh);
      // scene.updateWorldMatrix(true,true)
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh = undefined;
    }
  }

  // Three.js mesh
  mesh = new THREE.Mesh(ballGeometry, ballMaterial);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js body
  if (count >= 1) {
    if (body !== undefined) {
      world.removeBody(body);
      body = undefined;
    }
  }

  body = new CANNON.Body({
    mass: 2,
    position: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: defaultMaterial,
  });
  body.position.copy(position);
  body.addEventListener("collide", playHitSound);
  world.addBody(body);
  /**
   * Animation to reset to origin
   */

  gsap.to(body.position, { duration: 1.5, delay: 1, x: 0,z:0 });
  // if (position.x > 0 && position.z > 0) {
  // } else if(position.x > 0 && position.z < 0) {
  //   gsap.to(body.position, { duration: 2.5, delay: 1, x: 0,z:0 });
  // }

  // if(position.z > 0){
  //   gsap.to(body.position, { duration: 2.5, delay: 1, z: 2 });
  // }else {

  //   gsap.to(body.position, { duration: 2.5, delay: 1, z: 0 });
  // }

  // Save in objects
  objectsToUpdate.length = 0;
  objectsToUpdate.push({ mesh, body });
};

const handleClickBtn = () => {
  count++;
  let x = +xInput.value;
  let y = +yInput.value;

  // RESET Y
  // y = y / 5;
  y = y > 12.25 ? 12.25 : y;
  y = y < -12.25 ? -12.25 : y;
  // RESET X
  x = x > 12.25 ? 12.25 : x;
  x = x < -12.25 ? -12.25 : x;

  x = x / 5;
  y = y / 5;

  // REMOVE FORMER BALL
  if (count === 1) {
    scene.remove(defaultBall);
    world.removeBody(ballBody);
  }

  createSphere({ x, y:y, z : y });
};

createBtn.addEventListener("click", handleClickBtn);

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

//PHYSICS
// Setup our world
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.gravity.set(0, -9.81, 0); // m/s²
world.defaultContactMaterial = defaultContactMaterial;

const ballBody = new CANNON.Body({
  mass: 5, // kg
  position: new CANNON.Vec3(0, 0.25, 0), // m
  shape: new CANNON.Sphere(ballConstants.size),
});
world.addBody(ballBody);

// Create a  physics plane
const floorBody = new CANNON.Body({
  mass: 0, // mass == 0 makes the body static
});
const floorShape = new CANNON.Plane();
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
world.addBody(floorBody);

/**
 * Object
 */
const floorGeometry = new THREE.PlaneGeometry(
  planeConstants.breath,
  planeConstants.len
);

const floorMaterial = new THREE.MeshStandardMaterial({
  color: "red",
  side: THREE.DoubleSide,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.receiveShadow = true;
floor.rotation.x = -(Math.PI * 0.5);
scene.add(floor);

const defaultBall = new THREE.Mesh(ballGeometry, ballMaterial);
defaultBall.castShadow = true;
defaultBall.position.y = 0.25;
// defaultBall.position.z = -5;
// defaultBall.position.x = -5;
scene.add(defaultBall);

// LIGHTS

const ambientLight = new THREE.AmbientLight("#fff", 0.75);
const directionalLight = new THREE.DirectionalLight(0xffee);
directionalLight.position.set(4, 5, 5).normalize();
scene.add(ambientLight);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  30,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 0;
camera.position.y = 5;
camera.position.z = -10;
// camera.position.set(- 3, 3, 3)
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// controls.enableRotate = false;
// controls.enableZoom = false;
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  // antialias:true,
  // alpha: true
});
renderer.shadowMap.enabled = true;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Update physics
  world.step(1 / 60, deltaTime, 3);

  for (const object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  }


  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

// testures follow the PBR principle
// physically based rendering(PBR)
//many techniques that tend to follow real-life directions to get realistic results
// many softwares and engines are using it
