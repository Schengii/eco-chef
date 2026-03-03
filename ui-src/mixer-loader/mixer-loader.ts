import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import loaderStyles from './mixer-loader-styles';

@customElement('mixer-loader')
export class MixerLoader extends LitElement {

    @property({ type: Boolean })
    public hide = true;

    static override get styles() {
        return [loaderStyles];
    }

    protected override render() {
        if(!this.hide){
            return html`
                <div id="overlay">
                    <div class="loader"></div>
                    <div class="blink">Dein Cocktail Rezept ist gleich fertig ...</div>
                  
                </div>
         `
        }
        return html``;
    }

}
