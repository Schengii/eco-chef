/** Minimal typings for the Cordova plugins EcoChef uses (cordova-plugin-camera, app exit). */
interface CordovaCameraOptions {
    quality: number;
    destinationType: number;
    encodingType: number;
    mediaType: number;
    correctOrientation: boolean;
    targetWidth: number;
    targetHeight: number;
}

interface CordovaCamera {
    DestinationType: { DATA_URL: number };
    EncodingType: { JPEG: number };
    MediaType: { PICTURE: number };
    getPicture(
        onSuccess: (imageData: string) => void,
        onError: (message: string) => void,
        options: CordovaCameraOptions
    ): void;
}

interface Navigator {
    camera?: CordovaCamera;
    app?: { exitApp(): void };
}
