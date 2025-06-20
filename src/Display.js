
import { CSS2DObject } from "three/examples/jsm/Addons.js";

export class TextDisplay extends CSS2DObject{
    constructor(text) {
        var div = document.createElement('div');
        div.className = 'label';
        div.textContent = text;
        div.style.marginTop = '-1em';
        div.style.color = 'white';
        div.id = 'info';
        super(div);
        this.baseEntity = div;
    };
    setText(text){ this.baseEntity.textContent = text;};
}