import { SimpleGun } from "../weapons/SimpleGun";
import { Enemy } from "./Enemy";
import { GameState } from "@/GameState";

export class Corvette extends Enemy{
    constructor(position, scene, team){
        super("spaceship1", position, scene, team);
        this.MAX_SPEED = 2;
        this.ACCELERATION = 1.5;
        this.TURN_SPEED = 0.5;
        this.BASE_DRAG = 1.005;
        this.MAX_HP = 10;
        this.SIGHT_CONE = Math.PI/6;
        this.SIGHT_DISTANCE = 30;
        this.AGGRO_GRACE = 5;
        this.AGGRO_TIME = 10;


        this.scene = scene;
        this.suspects = [];
        this.currentSpeed = 0;
        this.currentBehavior = 'wander';
        this.damageReceived = 0;
        this.target = null;
        this.targetLastSeen = 0;

        this.mainGun = new SimpleGun(this,scene);
    }

    update(time){
        if (!this.loaded || !this.obj) return;
        if(!this.target && this.suspects.length > 0){
            var suspectToKeep = [];
            var closestAggro = 0;
            for(let suspect of this.suspects){
                if(!suspect.ptr || !suspect.ptr.loaded) continue;
                const distance = this.isSeen(suspect.ptr);
                if (distance<0 || distance>this.SIGHT_DISTANCE)
                    suspect.time -= time;    
                else
                    suspect.time += time * (this.SIGHT_DISTANCE+5 - distance)/this.SIGHT_DISTANCE;
                if(suspect.time > this.AGGRO_GRACE)
                    this.target = suspect.ptr;
                else if(suspect.time > 0)
                        suspectToKeep.push(suspect);
                closestAggro = Math.max(closestAggro, suspect.time);
            }

            if(this.target){
                this.suspects = [];
                this.alert.setAlert('red', "!");
                this.alert.setVisible(true);
            }else{
                this.suspects = suspectToKeep;
                if (this.suspects.length > 0){
                    this.alert.setAlert("yellow", "?");
                    this.alert.setVisible(true);
                }
                else{
                    this.alert.setVisible(false);
                }
            }
        }
        else if(!this.target){
            const playerVis = this.isSeen(GameState.player);
            if(playerVis>0 && playerVis<this.SIGHT_DISTANCE){
                var suspect = {
                    ptr: GameState.player,
                    time:0
                }
                this.suspects.push(suspect);
            }

            for(let entry of GameState.npcs){
                if(!entry || !entry.loaded || entry === this || entry.getTeam() === this.team) continue;
                const visible = this.isSeen(entry);
                if(visible>0 && visible<this.SIGHT_DISTANCE){
                    var suspect = {
                        ptr: entry,
                        time:0
                    }
                    this.suspects.push(suspect);
                }
            }

            if (this.suspects.length > 0){
                this.alert.setVisible(true);
                this.alert.setAlert('yellow','?');
            }
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

        this.movement(time, targetConfiguration);
        this.collision(GameState.objects);
    }

    movement(dt, configuration){
        // this.obj.translateOnAxis(new Vector3(1,0,0), dt*this.MAX_SPEED);
    }


    collision(objectList){

    }

    fireArmaments(){
        this.mainGun.shoot();
    }
    kill(){
        this.destroy();
    }
}