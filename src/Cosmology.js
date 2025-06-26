import { Group, Vector3, Mesh } from "three";
import * as THREE from 'three';
import { GameState } from '@/GameState';
import { GameConfigs } from '@/GameConfigs';
import { Explosion } from "./ExplosionAnimation";

const TEXTURE_LIST = ['RedRock02_2K', 'GreyRock02_2K', 'SeasideRocks02_2K', 'BrownRock09_2K'];

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
    constructor(position, radius, mass, type) {
        this.INIT_SPEED = 10;
        this.ROTATION_SPEED = 0.1;
        const textureLoad = new THREE.TextureLoader();

        const base = textureLoad.load(`/assets/planetsMaps/${TEXTURE_LIST[type]}_BaseColor.png`, (tex) => {
            console.log("Loaded:", tex.image?.src);
        });
        const normal = textureLoad.load(`/assets/planetsMaps/${TEXTURE_LIST[type]}_Normal.png`, (tex) => {
            console.log("Loaded:", tex.image?.src);
        });
        const roughness = textureLoad.load(`/assets/planetsMaps/${TEXTURE_LIST[type]}_Roughness.png`, (tex) => {
            console.log("Loaded:", tex.image?.src);
        });
        const ao = textureLoad.load(`/assets/planetsMaps/${TEXTURE_LIST[type]}_AO.png`, (tex) => {
            console.log("Loaded:", tex.image?.src);
        });
        const height = textureLoad.load(`/assets/planetsMaps/${TEXTURE_LIST[type]}_Height.png`, (tex) => {
            console.log("Loaded:", tex.image?.src);
        });


        this.boom = false;
        this.size = radius;
        this.name = "planet" + GameState.planetUUID;
        GameState.planetUUID++;
        this.mass = mass;


        this.collisionMemory = {}

        this.geometry = new THREE.SphereGeometry(radius, 32,32);
        this.geometry.attributes.uv2 = this.geometry.attributes.uv;
        this.mtl = new THREE.MeshStandardMaterial({
            map:base,
            normalMap:normal,
            aoMap:ao,
            roughness:roughness,
            displacementMap:height,
            displacementScale:0.1
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
        this.rotDir = Math.floor(Math.random()*3);

    }

    getMesh(){ return this.mesh; }

    getMass(){ return this.mass; }

    setVisible(state){
        this.mesh.visible = state;
    }

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
        const orbitalSpeed = Math.sqrt(massSun * GameConfigs.GRAVITATION / Math.max(distance, 1));

        this.speed = vel.multiplyScalar(orbitalSpeed);
        GameState.scene.add(this.mesh);
    }

    update(dt){
        const time = dt * GameState.timeDial;
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
        switch (this.rotDir) {
            case 0:
                this.mesh.rotation.y += time*this.ROTATION_SPEED
                break;
            case 1:
                this.mesh.rotation.x += time*this.ROTATION_SPEED
                break;
            case 2:
                this.mesh.rotation.z += time*this.ROTATION_SPEED
                break;
            default:
                break;
        }
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
            
            const acceleration = planet.getMass()*GameConfigs.GRAVITATION / Math.max(distance*distance, 1);

            sumVector.add(vectorToPlanet.clone().normalize().multiplyScalar(acceleration));
        })
        return sumVector;
    }

    detonation(){
        if(this.boom) return;
        this.boom = true;
        const explode = new Explosion(this);
        GameState.explosions.push(explode);
    }

    destroy(){
        this.mesh.position.set(generatePlanetPosition());
        this.initPlanetSpeed(other.getWorldPosition());
        this.boom = false;
    }

    checkSun(){
        const sunPos = GameState.sun.getWorldPosition();
        const sunRad = GameState.sun.getHitboxSize();

        const myPos = this.getWorldPosition();
        
        const direction = new Vector3();
        direction.subVectors(sunPos, myPos);
        if(direction.length() < sunRad + this.getHitboxSize()){
            this.detonation();
        }

    }

    collision(other){
        if(!(other instanceof Planet)) return;
        if (this.collisionMemory[other.getName()]) return;
        
        const myPos = this.getWorldPosition();
        const otherPos = other.getWorldPosition();

        const dist = new Vector3();
        dist.subVectors(otherPos, myPos);
        if(dist.length() < this.getHitboxSize() + other.getHitboxSize()){
            const myVel = this.getVelocity();
            const otherVel = other.getVelocity();
            const relativeVel = otherVel.clone().sub(myVel);

            
            const direction = (dist.lengthSq() === 0)? new Vector3(): dist.clone().normalize(); 
            const impactSpeed = relativeVel.dot(direction);
            
            const deltaL = (this.getHitboxSize() + other.getHitboxSize()) - dist.length();
            const dirMine = direction.clone().multiplyScalar(-1);
            const dirOther = direction.clone();

            if(impactSpeed < 0) {
                const report = {
                    impulse: 1,
                    direction: dirMine,
                };

                const otherReport = {
                    impulse: 1,
                    direction: dirOther
                };

                this.collisionMemory[other.getName()] = report;
                other.collisionMemory[this.getName()] = otherReport;
                if (deltaL>0){
                    this.mesh.position.addScaledVector(dirMine, deltaL/2);
                    other.mesh.position.addScaledVector(dirOther, deltaL/2);
                }
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
        this.light = new THREE.DirectionalLight(0xffc100,5);
        this.geometry = new THREE.SphereGeometry(radius, 32,32);
        this.mtl = new THREE.MeshBasicMaterial({
            map:sunTexture,
            color: 0xffaa00
        });
        
        this.mesh = new Mesh(this.geometry, this.mtl);
        this.spriteMap = textureLoader.load('./assets/starsprite.png');
        this.spriteMaterial = new THREE.SpriteMaterial({
        map: this.spriteMap,
        color: 0xffc100,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        });
        this.glowSprite = new THREE.Sprite(this.spriteMaterial);
        this.glowSprite.scale.set(radius * 5, radius * 5, 1);
        this.glowSprite.position.copy(position);

        GameState.scene.add(this.glowSprite);
        
        this.group = new Group();
        this.group.add(this.light);
        this.group.add(this.mesh);
        this.group.add(this.glowSprite);

        this.group.position.copy(position);

        GameState.scene.add(this.light);
        GameState.scene.add(this.group);


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
        this.mesh.rotation.y += time*0.1;
    }
}