/** @jest-environment jsdom */
import { CameraController, CameraHost } from './camera.controller';

function make() {
    const fileInput = document.createElement('input');
    fileInput.id = 'file-upload';
    fileInput.type = 'file';
    document.body.appendChild(fileInput);

    const video = document.createElement('video');
    video.id = 'webcam-video';
    document.body.appendChild(video);

    const canvas = document.createElement('canvas');
    canvas.id = 'webcam-canvas';
    document.body.appendChild(canvas);

    const host: CameraHost = {
        renderRoot: document.body,
        addController: jest.fn(),
        removeController: jest.fn(),
        requestUpdate: jest.fn(),
        updateComplete: Promise.resolve(true),
        setCapturedImage: jest.fn(),
        announce: jest.fn()
    };

    return { host, controller: new CameraController(host), fileInput, video, canvas };
}

describe('CameraController', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        delete (navigator as any).camera;
    });

    it('attaches to host on construct', () => {
        const { host, controller } = make();
        expect(host.addController).toHaveBeenCalledWith(controller);
        expect(controller.showWebcam).toBe(false);
    });

    it('uses Cordova camera when navigator.camera is available', async () => {
        const { host, controller } = make();
        const getPicture = jest.fn((success) => success('base64jpegdata'));
        (navigator as any).camera = {
            getPicture,
            DestinationType: { DATA_URL: 0 },
            EncodingType: { JPEG: 0 },
            MediaType: { PICTURE: 0 }
        };

        await controller.open();
        expect(getPicture).toHaveBeenCalled();
        expect(host.setCapturedImage).toHaveBeenCalledWith('data:image/jpeg;base64,base64jpegdata');
        expect(host.announce).toHaveBeenCalledWith('Foto erfolgreich über App-Kamera aufgenommen.');
    });

    it('handles Cordova camera errors', async () => {
        const { host, controller } = make();
        const getPicture = jest.fn((_success, error) => error('User cancelled'));
        (navigator as any).camera = {
            getPicture,
            DestinationType: { DATA_URL: 0 },
            EncodingType: { JPEG: 0 },
            MediaType: { PICTURE: 0 }
        };

        await controller.open();
        expect(host.announce).toHaveBeenCalledWith('Fehler bei der App-Kamera.');
    });

    it('opens webcam when getUserMedia is supported', async () => {
        const { host, controller, video } = make();
        const stopMock = jest.fn();
        const mockStream = {
            getTracks: () => [{ stop: stopMock }]
        };
        Object.defineProperty(navigator, 'mediaDevices', {
            value: { getUserMedia: jest.fn().mockResolvedValue(mockStream) },
            configurable: true
        });

        await controller.open();
        expect(controller.showWebcam).toBe(true);
        expect(video.srcObject).toBe(mockStream);
        expect(host.announce).toHaveBeenCalledWith('Webcam-Vorschau gestartet.');

        controller.close();
        expect(controller.showWebcam).toBe(false);
        expect(stopMock).toHaveBeenCalled();
        expect(host.announce).toHaveBeenCalledWith('Kamera-Modus beendet.');
    });

    it('falls back to file picker when getUserMedia fails or is missing', async () => {
        const { controller, fileInput } = make();
        const clickSpy = jest.spyOn(fileInput, 'click');

        Object.defineProperty(navigator, 'mediaDevices', {
            value: { getUserMedia: jest.fn().mockRejectedValue(new Error('Permission denied')) },
            configurable: true
        });

        await controller.open();
        expect(clickSpy).toHaveBeenCalled();
    });

    it('captures frame from video onto canvas', () => {
        const { host, controller, canvas } = make();
        jest.spyOn(canvas, 'getContext').mockReturnValue({
            drawImage: jest.fn()
        } as unknown as CanvasRenderingContext2D);
        jest.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,capturedimage');
        controller.capture();

        expect(host.setCapturedImage).toHaveBeenCalledWith('data:image/jpeg;base64,capturedimage');
        expect(host.announce).toHaveBeenCalledWith('Foto erfolgreich aufgenommen.');
        expect(controller.showWebcam).toBe(false);
    });

    it('handles file upload via FileReader', (done) => {
        const { host, controller } = make();
        const blob = new Blob(['dummy content'], { type: 'image/jpeg' });
        const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
        const event = { target: { files: [file] } } as unknown as Event;

        controller.handleFileUpload(event);
        setTimeout(() => {
            expect(host.setCapturedImage).toHaveBeenCalled();
            done();
        }, 50);
    });

    it('stops stream on hostDisconnected', () => {
        const { controller } = make();
        const stopMock = jest.fn();
        (controller as any).stream = { getTracks: () => [{ stop: stopMock }] };

        controller.hostDisconnected();
        expect(stopMock).toHaveBeenCalled();
        expect((controller as any).stream).toBeNull();
    });
});
