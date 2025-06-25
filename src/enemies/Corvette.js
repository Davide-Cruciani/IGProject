import { SimpleGun } from "../weapons/Weapons";
import { Enemy } from "./Enemy";
import { GameState } from "@/GameState";

export class Corvette extends Enemy{
    constructor(position, scene, team){
        super("spaceship1", position, scene, team);
        this.name += 'Corvette' + GameState.npcUUID;
        GameState.npcsUUID++;
        this.MAX_SPEED = 2;
        this.ACCELERATION = 1.5;
        this.TURN_SPEED = 0.5;
        this.BASE_DRAG = 1.005;
        this.MAX_HEALTH = 500;
        this.MASS = 10;
        this.SIGHT_CONE = Math.PI/4;
        this.SIGHT_DISTANCE = 60;
        this.AGGRO_GRACE = 5;
        this.AGGRO_TIME = 5;


        this.scene = scene;
        this.suspects = [];
        this.currentBehavior = 'wander';
        this.currentHealth = this.MAX_HEALTH;
        this.target = null;
        this.targetLastSeen = 0;

        this.mainGun = new SimpleGun(this,scene);
    }

    update(time){
        if (!this.loaded || !this.obj) return;

        this.dealWithCollisions();

        if(!this.target && this.suspects.length > 0){
            this.checkOnSuspects(time);
        }
        else if(!this.target){
            this.findSuspects();
        }
        else{
            const visible = this.isSeen(this.target);
            if(visible>0 && visible<this.SIGHT_DISTANCE){
                this.targetLastSeen = 0;
                this.fireArmaments();
                this.alert.setAlert('red', '!');
                this.alert.setVisible(true);
            }else if(this.targetLastSeen > this.AGGRO_TIME){
                this.target = null;
                this.targetLastSeen = 0;
                this.alert.setVisible(false);
            }else{
                this.targetLastSeen+=time;
                this.alert.setAlert('yellow',"!");
                this.alert.setVisible(true);
            }
        }


        const targetConfiguration = {
            position: this.getWorldPosition(),
            orientation: this.getWorldDirection()
        };

        this.movement(time);
    }

    movement(time){
        if(!this.loaded || !this.obj) return;
        switch (this.currentBehavior) {
            case 'wander':
                
                break;
        
            case 'chase':

                break;

            case 'follow':

                break;

            default:
                throw new Error('Unknown behavior');
        }


        // this.obj.position.addScaledVector(this.vel, time);
        const gravityVector = this.computeGravity();
        const targetPos = this.obj.position.clone().addScaledVector(this.vel, time);
        this.obj.position.lerp(targetPos, 0.1);
        this.vel.addScaledVector(gravityVector, time);
    }

    getVelocity(){
        return this.vel.clone();
    }
    

    checkOnSuspects(time){
        this.suspects = this.suspects.filter((suspect)=>{
            if(!suspect.ptr || !suspect.ptr.loaded) return true;
            const distance = this.isSeen(suspect.ptr);
            
            if (distance<0 || distance>this.SIGHT_DISTANCE)
                suspect.time -= time;    
            else
                suspect.time += time * (this.SIGHT_DISTANCE+5 - distance)/this.SIGHT_DISTANCE;

            if(suspect.time > this.AGGRO_GRACE){
                this.target = suspect.ptr;
                return false;
            }
            return (suspect.time > 0)
        });

        if(this.target){
            this.suspects = [];
            this.alert.setAlert('red', "!");
            this.alert.setVisible(true);
        }else{
            if (this.suspects.length > 0){
                this.alert.setAlert("yellow", "?");
                this.alert.setVisible(true);
            }
            else{
                this.alert.setVisible(false);
            }
        }
    }

    findSuspects(){

        const candidates = [];

        const playerVis = this.isSeen(GameState.player);
        if(playerVis>0 && playerVis<this.SIGHT_DISTANCE){
            var suspect = {
                ptr: GameState.player,
                time:0
            }
            candidates.push(suspect);
        }

        for(let entry of GameState.npcs){
            if(!entry || !entry.loaded || entry === this || entry.getTeam() === this.team) continue;
            const visible = this.isSeen(entry);
            if(visible>0 && visible<this.SIGHT_DISTANCE){
                const suspect = {
                    ptr: entry,
                    time:0
                }
                candidates.push(suspect);
            }
        }

        candidates.forEach((candidate)=>{
            const exists = this.suspects.find((val)=> val.ptr === candidate.ptr);
            if (!exists) this.suspects.push(candidate);
        })

        if (this.suspects.length > 0){
            this.alert.setVisible(true);
            this.alert.setAlert('yellow','?');
        }
    }

    fireArmaments(){
        this.mainGun.shoot();
    }
    kill(){
        this.destroy();
    }
}