import { Group, Vector3, Mesh } from "three";
import * as THREE from 'three';
import { GameState } from '@/GameState';
import { Configs } from '@/Configs';

export const BLOOM_LAYER = 1;

const STAR_FS = `
    uniform vec3 glowColor;
    uniform float intensity;
    uniform float fade;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPos);
        float glow = pow(intensity - dot(vNormal, viewDirection), fade);
        gl_FragColor = vec4(glowColor, glow);
    }
`;

const STAR_VS = `
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`;

export function generatePlanetPosition(){
    const sunPos = GameState.sun.getWorldPosition();

    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const radius = 300 + Math.random() * 200;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    const offset = new THREE.Vector3(x, y, z);
    return sunPos.clone().add(offset);
}
export class Planet{
    constructor(position, radius, mass, color) {
        this.INIT_SPEED = 10;
        this.ROTATION_SPEED = 0.1;

        this.size = radius;
        this.name = "planet" + GameState.planetUUID;
        GameState.planetUUID++;
        this.mass = mass;


        this.collisionMemory = {}

        this.geometry = new THREE.SphereGeometry(radius, 32,32);
        this.mtl = new THREE.MeshPhongMaterial({
            color:color,
        });
        this.atmGeometry = new THREE.SphereGeometry(radius * 1.05, 32,32);
        this.atmMtl = new THREE.MeshPhongMaterial({
            color:0x00aaff,
            transparent:true,
            opacity:0.2,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        })
        this.mesh = new Mesh(this.geometry, this.mtl);
        this.atmMesh = new Mesh(this.atmGeometry, this.atmMtl);
        this.mesh.add(this.atmMesh);
        this.mesh.position.copy(position);
        this.speed = new Vector3(1,0,0);

    }

    getMesh(){ return this.mesh; }

    getMass(){ return this.mass; }

    getWorldPosition(){
        this.mesh.updateMatrixWorld(true);
        const res = new Vector3();
        this.mesh.getWorldPosition(res);
        
        return res;
    }

    initPlanetSpeed(sunPos){
        const position = this.getWorldPosition();
        const forceDir = new Vector3().subVectors(sunPos, position);
        const distance = forceDir.length();

        var randomVec = new Vector3(Math.random(), Math.random(), Math.random()).normalize();
        var axis1 = new Vector3().crossVectors(forceDir, randomVec).normalize();
        if (axis1.lengthSq() === 0) {
            randomVec = new Vector3(1, 0, 0);
            axis1 = new Vector3().crossVectors(forceDir, randomVec).normalize();
        }
    
        const axis2 = new Vector3().crossVectors(forceDir, axis1).normalize();
        const angle = Math.random() * 2 * Math.PI;
        const vel = new Vector3();
        vel.copy(axis1).multiplyScalar(Math.cos(angle));
        vel.addScaledVector(axis2, Math.sin(angle));
        
        const massSun = GameState.sun.getMass();
        const orbitalSpeed = Math.sqrt(massSun * Configs.gravitation / Math.max(distance, 1));

        this.speed = vel.multiplyScalar(orbitalSpeed);
    }

    update(time){
        const gravity = this.computeGravity();

        const collisionsResult = new Vector3();
        for(const planet in this.collisionMemory){
            const data = this.collisionMemory[planet];
            collisionsResult.addScaledVector(data.direction, data.impulse);
        }

        this.collisionMemory = {};

        this.speed.addScaledVector(gravity, time);
        this.speed.addScaledVector(collisionsResult, time);
        this.mesh.position.addScaledVector(this.speed, time);
        this.mesh.rotation.y += time*this.ROTATION_SPEED
    }

    computeGravity(){
        const sumVector = new Vector3();
        const currentPos = this.getWorldPosition();
        GameState.planets.forEach((planet)=>{
            if(planet === this) return;
            const planetPos = planet.getWorldPosition();


            const vectorToPlanet = new Vector3();
            vectorToPlanet.subVectors(planetPos, currentPos);

            const distance = vectorToPlanet.length();
            if (distance <= 0 || isNaN(distance)) return;
            
            const acceleration = planet.getMass()*Configs.gravitation / Math.max(distance*distance, 1);

            sumVector.add(vectorToPlanet.clone().normalize().multiplyScalar(acceleration));
        })
        return sumVector;
    }

    detonation(){

    }

    checkSun(){
        const sunPos = GameState.sun.getWorldPosition();
        const sunRad = GameState.sun.getHitboxSize();

        const myPos = this.getWorldPosition();
        
        const direction = new Vector3();
        direction.subVectors(sunPos, myPos);
        if(direction.length() < sunRad + this.getHitboxSize()){
            this.detonation();
            this.mesh.position.set(generatePlanetPosition());
            this.initPlanetSpeed(other.getWorldPosition());
        }

    }

    collision(other){
        if(!(other instanceof Planet)) return;
        if (this.collisionMemory[other.getName()]) return;
        
        const myPos = this.getWorldPosition();
        const otherPos = this.getWorldPosition();

        const dist = new Vector3();
        dist.subVectors(otherPos, myPos);
        if(dist.length() < this.getHitboxSize() + other.getHitboxSize()){
            const myVel = this.getVelocity();
            const otherVel = other.getVelocity();
            const relativeVel = otherVel.clone().sub(myVel);

            const direction = (dist.lengthSq() === 0)? new Vector3(): dist.clone().normalize(); 
            const impactSpeed = relativeVel.dot(direction);

            if(impactSpeed < 0) {
                const report = {
                    impulse: 1,
                    direction: direction.clone().multiplyScalar(-1),
                };

                const otherReport = {
                    impulse: 1,
                    direction: direction.clone()
                };

                this.collisionMemory[other.getName()] = report;
                other.collisionMemory[this.getName()] = otherReport;
            }

        }
    }

    getWorldDirection(){
        const forward = new Vector3(0,1,0);
        forward.applyQuaternion(this.mesh.quaternion);
        return forward.normalize();
    }

    getVelocity(){ return this.speed; }
    getName(){ return this.name; }
    getHitboxSize(){ return this.size; }

}
export class Star{
    constructor(position, radius, mass){
        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load('./assets/planetsMaps/2k_sun.jpg');
        this.size = radius;
        this.mass = mass;
        this.name = 'sun';
        this.light = new THREE.DirectionalLight(0xffc100,1);
        this.geometry = new THREE.SphereGeometry(radius, 32,32);
        this.mtl = new THREE.MeshBasicMaterial({
            map:sunTexture,
        });

        this.glowMtl = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0xffc100) },
                intensity: { value: 1.0 }, 
                fade: { value: 2.0 }
            },
            vertexShader: STAR_VS,
            fragmentShader: STAR_FS,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        this.glowGeometry = new THREE.SphereGeometry(radius * 1.05, 64, 64);
        
        this.mesh = new Mesh(this.geometry, this.mtl);
        this.glowMesh = new Mesh(this.glowGeometry, this.glowMtl);
        
        this.group = new Group();
        this.group.add(this.light);
        this.group.add(this.mesh);
        this.group.add(this.glowMesh);
        this.group.position.copy(position);


        this.group.traverse((child)=>{
            if(child.isMesh){
                child.layers.set(BLOOM_LAYER);
                child.layers.enable(0);
            }
        });
    }
    
    getVelocity(){
        return new Vector3();
    }

    getMesh(){ return this.group; }

    getMass(){ return this.mass; }

    getName(){ return this.name; }

    getHitboxSize(){ return this.size; }

    getWorldPosition(){
        this.group.updateMatrixWorld(true);
        const res = new Vector3();
        this.group.getWorldPosition(res);
        
        return res;
    }

    collision(object){
        if(!(object instanceof Planet))
        object.checkSun();
    }

    update(time){
        this.light.intensity = 1.0 + 0.1 * Math.sin(time * 5.0);
    }
}