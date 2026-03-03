import {css, html, LitElement, TemplateResult} from 'lit';
import { customElement, query, queryAll } from 'lit/decorators.js';
import { GoogleGenAI } from '@google/genai';
import { TextField } from "@vaadin/text-field";
import { MixerLoader } from "./mixer-loader/mixer-loader";
import "./mixer-loader/mixer-loader";
import "@vaadin/text-field";
import "@vaadin/button";
import "@vaadin/icons";
import "@vaadin/icon";
import "@vaadin/markdown";
import "@vaadin/integer-field";
import { Markdown } from "@vaadin/markdown";
// @ts-ignore
import GeminiLogo from "./gemini-logo.png";
import {IntegerField} from "@vaadin/integer-field";


@customElement('mixer-app')
export class MixerApp extends LitElement {

    @query('#inputField') inputField!: TextField;
    @query('#anzahlField') anzahlField!: IntegerField;
    @query('#loader') loader?: MixerLoader;
    @query('#markdown') markdown?: Markdown;
    @query('.hamburger') hamburger?: HTMLElement;
    @query('.nav-menu') navMenu?: HTMLElement;
    @queryAll('.nav-link') navLinks?: HTMLElement[];

    static override styles = css`
            .container{
                width: 100%;
                text-align: center;
            }
            .gemini{
                width: 100%;
                text-align: right;
                
            }
            .logo{
                margin-right: 25px;
                width: 100px
            }
        `;

    override render(): TemplateResult {

        return html`
            
            <mixer-loader id="loader"></mixer-loader>
            <div class="container">
                <h1>My Mixer</h1>
                <p class="gemini">powered by <img src="${GeminiLogo}" class="logo"></p>
                
                <vaadin-text-field id="inputField" style="width: 300px" clear-button-visible>
                    <vaadin-icon slot="prefix" icon="vaadin:search"></vaadin-icon>
                </vaadin-text-field>
                <vaadin-integer-field id="anzahlField" style="width: 300px"
                        value="1"
                        step-buttons-visible
                        min="1"
                        max="3"
                ></vaadin-integer-field>
                <vaadin-button @click="${this.askGoogle}" theme="primary">mix it</vaadin-button>
                <vaadin-button @click="${this.reset}" theme="primary error">reset</vaadin-button>
            </div>    
            <vaadin-markdown id="markdown" ></vaadin-markdown>
        `;
    }

    override async firstUpdated() {

    }

    async askGoogle(): Promise<void> {
        const ai = new GoogleGenAI({apiKey: "AIzaSyAc6JMsrkOHNRozMAlpSmxCympSH-tT39E"});
        this.loader!.hide = false;
        this.markdown!.content=``;
        var anzahlText:string="einen Cocktailvoschlag";
        if(this.anzahlField.value !== "1"){
            anzahlText= this.anzahlField.value + " Cocktailvorschläge";
        }
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generiere mir " + anzahlText + " für diese Zutaten: " + this.inputField?.value + " und gib das Ergebnis als Markdown aus.",
        });
        console.log(response.text);
        this.loader!.hide = true;
        this.markdown!.content=`${response.text}`;
    }

    reset(): void {
        this.markdown!.content=``;
        this.inputField!.value=``;
        this.anzahlField.value="1";
    }
}