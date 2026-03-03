import { css } from 'lit';

export default css`
    #overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 105, 175, 0.1);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    .loader {
        width: 52px;
        height: 102px;
        display: inline-block;
        left: 5px;
        position: relative;
        border: 2px solid #FFF;
        box-sizing: border-box;
        animation: animloader 2s linear infinite alternate;
        color: var(--neufa-active-blue);
        border-radius: 0 0 4px 4px;
        transform: perspective(140px) rotateX(-45deg);
    }

    @keyframes animloader {
        0% {
            box-shadow: 0 0  inset;
        }
        100% {
            box-shadow: 0 -100px inset;
        }
    }

    .blink {
        animation-name: animation_blink;
        animation-timing-function: ease-in;
        animation-duration: 2s;
        animation-iteration-count: infinite;
        font-size: small;
    }

    @keyframes animation_blink {
        0% { opacity: 1; }
        50% { opacity: 0.1; }
        100% { opacity: 1; }
    }

`;