import { Enemy } from "./Enemy";
import { TextDisplay } from "../Display";
import { Vector3 } from "three";

export class Corvette extends Enemy{
    constructor(position, scene){
        super("spaceship1", position, scene);
        this.SPEED = 1;
        this.TURN_SPEED = 0.5;
        this.BASE_DRAG = 1.005;
        this.MAX_HP = 10;
        this.SIGHT_CONE = Math.PI/6;
        this.damageReceived = 0;
        this.playerSpotted = false;
    }

    update(time, player, objectList){
        if(!player || !player.loaded) return;
        if(!this.playerSpotted){
            var position = player.getWorldPosition();
            var sight = this.obj.getWorldDirection(new Vector3);
            if(Math.abs(sight.angleTo(position))<this.SIGHT_CONE){
                this.playerSpotted = true;
                this.note = new TextDisplay("!");
                this.obj.add(this.note);
            }
        }
        if(this.playerSpotted){

            this.fireArmaments();
        }
        this.movement(time);
        this.collision(objectList);
    }

    movement(){
        
    }


    collision(){

    }

    fireArmaments(){

    }
}