import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface CameraHost extends ReactiveControllerHost {
    readonly renderRoot: HTMLElement | DocumentFragment;
    setCapturedImage(dataUrl: string): void;
    announce(message: string): void;
}

/** Photo input: Cordova camera in the app, getUserMedia webcam in the browser, file picker as fallback. */
export class CameraController implements ReactiveController {
    showWebcam = false;
    private stream: MediaStream | null = null;

    constructor(private readonly host: CameraHost) {
        host.addController(this);
    }

    hostConnected(): void {}

    hostDisconnected(): void {
        this.stopStream();
    }

    open = async (): Promise<void> => {
        const camera = navigator.camera;
        if (camera) {
            camera.getPicture(
                (imageData: string) => {
                    this.host.setCapturedImage('data:image/jpeg;base64,' + imageData);
                    this.host.announce('Foto erfolgreich über App-Kamera aufgenommen.');
                },
                (error: string) => {
                    console.error('Cordova Camera error:', error);
                    this.host.announce('Fehler bei der App-Kamera.');
                },
                {
                    quality: 70,
                    destinationType: camera.DestinationType.DATA_URL,
                    encodingType: camera.EncodingType.JPEG,
                    mediaType: camera.MediaType.PICTURE,
                    correctOrientation: true,
                    targetWidth: 800,
                    targetHeight: 800
                }
            );
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            this.triggerFilePicker();
            return;
        }
        try {
            this.showWebcam = true;
            this.host.requestUpdate();
            await this.host.updateComplete;
            // Prefer the rear camera on mobile browsers
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            const video = this.host.renderRoot.querySelector<HTMLVideoElement>('#webcam-video');
            if (video) video.srcObject = this.stream;
            this.host.announce('Webcam-Vorschau gestartet.');
        } catch (err) {
            console.warn('Webcam access failed, falling back to file picker', err);
            this.showWebcam = false;
            this.host.requestUpdate();
            this.triggerFilePicker();
        }
    };

    capture = (): void => {
        const video = this.host.renderRoot.querySelector<HTMLVideoElement>('#webcam-video');
        const canvas = this.host.renderRoot.querySelector<HTMLCanvasElement>('#webcam-canvas');
        const ctx = canvas?.getContext('2d');
        if (video && canvas && ctx) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            this.host.setCapturedImage(canvas.toDataURL('image/jpeg'));
            this.host.announce('Foto erfolgreich aufgenommen.');
        }
        this.close();
    };

    close = (): void => {
        this.stopStream();
        this.showWebcam = false;
        this.host.announce('Kamera-Modus beendet.');
        this.host.requestUpdate();
    };

    handleFileUpload = (event: Event): void => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => this.host.setCapturedImage(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    private triggerFilePicker(): void {
        this.host.renderRoot.querySelector<HTMLInputElement>('#file-upload')?.click();
    }

    private stopStream(): void {
        this.stream?.getTracks().forEach(track => track.stop());
        this.stream = null;
    }
}
