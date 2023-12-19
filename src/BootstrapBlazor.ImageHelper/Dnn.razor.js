import { vibrate, addScript, Utils } from '/_content/BootstrapBlazor.ImageHelper/utils.js'
import { UtilsDnn } from '/_content/BootstrapBlazor.ImageHelper/UtilsDnn.js'

let loadingQr = true;
let img = new Image();
let qrcode_detector;
let element = null;
let instance = null;
let options = null;

export function init(_instance, _element, _options) {
    options = _options;
    instance = _instance;
    element = _element;
    let inputElement = element.querySelector('#' + options.fileInputDom);
    let captureElement = element.querySelector('#' + options.captureDom);
    let canvasOutput = element.querySelector('#' + _options.imageDataDom);
    let utils = new Utils(instance, element, options);
    canvasOutput.height = 0;
    canvasOutput.width = 0;

    inputElement.addEventListener('change', (e) => {
        img.src = URL.createObjectURL(e.target.files[0]);
    }, false);

    captureElement.addEventListener('change', (e) => {
        img.src = URL.createObjectURL(e.target.files[0]);
    }, false);

    img.onload = function () {
        let mat = cv.imread(img);
        cv.imshow(options.imageDataDom, mat);
        mat.delete();
        wechatQrcode452(instance, element, _options);
    };

    addScript(options.openCvUrl).then(
        () => {
            if (loadingQr) {
                let baseurl = '_content/BootstrapBlazor.ImageHelper/models/obj_detection/';
                let config = 'mobilenet_iter_deploy.prototxt';
                let mod = 'mobilenet_iter_73000.caffemodel';
                utils.createFileFromUrl(mod, baseurl + mod + '.txt', () => {
                    config = 'mobilenet_iter_deploy.prototxt';
                    utils.createFileFromUrl(config, baseurl + config + '.txt', () => {
                        loadingQr = false;
                        instance.invokeMethodAsync('GetResult', '加载模型文件完成');
                    });
                });
                instance.invokeMethodAsync('GetResult', '正在加载模型文件');
            }

            function onOpenCvReady() {
                instance.invokeMethodAsync('GetReady');
            }

            onOpenCvReady();
        },
        () => {
            utils.printError("Failed to load " + options.url);
        }
    );

}

function isLoadImage() {
    if (!img.src) {
        alert('请先上传图片')
        return false
    }
    return true
}

export function wechatQrcode452(instance, element, _options) {
    if (!isLoadImage()) return;

    console.time("OpenCV耗时");
    let utils = new UtilsDnn(instance, element, options);

    setTimeout(utils.main, 1);

    console.timeEnd("OpenCV耗时");
}

 