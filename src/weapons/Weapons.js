import { Clock, Vector3, Quaternion } from "three";
import { Bullet } from "./Bullet";
import { GameState } from "@/GameState";


export class DummyWeapon{
    constructor(){
        this.NAME = 'No weapon';
    }

    shoot(){
        return;
    }

    getName(){ return this.NAME; }
}

export class SimpleGun{
    constructor(ship){
        this.CD = 0.25;
        this.BULLET_TTL = 5;
        this.NAME = 'Basic Gun';
        this.ship = ship;
        this.idCounter = 0;

        this.timeKeeper = new Clock(true);
        this.timeLastBullet = 0;
    }

    createBulletName(){
        const name = `${this.ship.getName()}-${this.getName()}-${this.idCounter}`;
        this.idCounter++;
        return name;
    }

    shoot(){
        const elapsed = this.timeKeeper.getElapsedTime();
        if (elapsed - this.timeLastBullet > this.CD){
                const shipPos = this.ship.getWorldPosition();
                const shipDir = this.ship.getWorldDirection();
                const name = this.createBulletName(); 
                const bullet = new Bullet(shipPos, shipDir, this.ship, 0.07, name);
                this.timeLastBullet = elapsed;
                bullet.setTTL(this.BULLET_TTL);
                GameState.bullets.push(bullet);
                GameState.scene.add(bullet.getMesh());
            }
    }

    getName(){
        return this.NAME;
    }

    getCD(){
        const elapsed = this.timeKeeper.getElapsedTime();
        const time_left = this.CD - (elapsed - this.timeLastBullet);
        return time_left;
    }

}

export class Shotgun extends SimpleGun{
    constructor(ship) {
        super(ship);
        this.NAME = 'ShotGun';
        this.CD = 1.5;
        this.BULLET_TTL = 5;
        this.BULLETS_IN_SHELL = 4;
        this.SPREAD = Math.PI/6;
    }
    shoot(){
        const elapsed = this.timeKeeper.getElapsedTime();
        if (elapsed - this.timeLastBullet> this.CD){
            const shipPos = this.ship.getWorldPosition();
            const shipDir = this.ship.getWorldDirection();
            for(let i=0;i<this.BULLETS_IN_SHELL;i++){
                const randomAxis = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
                const randomAngle = Math.random() * this.SPREAD;

                const spreadQuat = new Quaternion().setFromAxisAngle(randomAxis, randomAngle);
                const spreadDir = shipDir.clone().applyQuaternion(spreadQuat).normalize();
                const name = this.ship.getName() + this.idCounter;

                const bullet = new Bullet(shipPos, spreadDir, this.ship, 0.12, name);
                bullet.setTTL(this.BULLET_TTL);
                this.idCounter++;
                GameState.bullets.push(bullet);
                GameState.scene.add(bullet.getMesh());
            }
            this.timeLastBullet = elapsed;
        }
    }
}