export class HUD{
    constructor(){
        this.htmlElement = document.createElement('div');
        this.htmlElement.id = 'hud';
        document.body.append(this.htmlElement);
    }

    addChild(child){
        this.htmlElement.appendChild(child)
    }

    removeChild(child){
        this.htmlElement.removeChild(child);
    }

    destroy(){
        document.removeChild(this.htmlElement);
    }
}

export class FPSIndicator{
    constructor(text){
        this.htmlElement = document.createElement('div');
        this.htmlElement.id = 'fps-counter';
        this.htmlElement.textContent = text;
    }
    setText(text){
        this.htmlElement.textContent = text;
    }
    getElement(){
        return this.htmlElement;
    }
}