import { Enemy } from "./Enemy";

export class Corvette extends Enemy{
    constructor(position, scene){
        super("spaceship1", position, scene);
        this.SPEED = 1;
        this.BASE_DRAG = 1.005;
    }

    update(){
        this.collision();
        this.movement();
        this.fireArmaments();
    }

    collision(){}
    movement(){}
    fireArmaments(){}
}