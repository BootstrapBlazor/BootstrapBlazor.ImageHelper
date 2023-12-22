import { vibrate, addScript, Utils } from '/_content/BootstrapBlazor.ImageHelper/utils.js'

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
        let src = cv.imread(img);
        src = cutImage(src, src);
        cv.imshow(options.imageDataDom, src);
        src.delete();
        wechatQrcode452(instance, element, _options);
    };

    addScript(options.openCvUrl).then(
        () => {
            if (loadingQr) {
                let baseurl = '_content/BootstrapBlazor.ImageHelper/models/';
                let mod = 'detect.caffemodel';
                utils.createFileFromUrl(mod, baseurl + mod + '.txt', () => {
                    mod = 'detect.prototxt';
                    utils.createFileFromUrl(mod, baseurl + mod + '.txt', () => {
                        mod = 'sr.caffemodel';
                        utils.createFileFromUrl(mod, baseurl + mod + '.txt', () => {
                            mod = 'sr.prototxt';
                            utils.createFileFromUrl(mod, baseurl + mod + '.txt', () => {
                                loadingQr = false;
                                qrcode_detector = new cv.wechat_qrcode_WeChatQRCode(
                                    "detect.prototxt",
                                    "detect.caffemodel",
                                    "sr.prototxt",
                                    "sr.caffemodel"
                                );
                                instance.invokeMethodAsync('GetResult', '加载模型文件完成');
                            });
                        });
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

function cutImage(src, dst, width = 600) {
    if (options.autoCaputeCrop) {
        if ((src.rows / src.cols) > 1.2) {
            //比例不对, 截取中间部分
            let rect = new cv.Rect(0, (src.rows - src.cols) / 2, src.cols, src.cols);
            dst = src.roi(rect);
        } else if ((src.cols / src.rows) > 1.2) {
            //比例不对, 截取中间部分
            let rect = new cv.Rect((src.cols - src.rows) / 2, 0, src.rows, src.rows);
            dst = src.roi(rect);
        }
        if (dst.rows > 600) {
            cv.resize(dst, dst, new cv.Size(width, width));
        }
        return dst;
    } else {
        return src;
    }
}
function isLoadImage() {
    if (!img.src) {
        alert('请先上传图片')
        return false
    }
    return true
}

export function wechatQrcode452(instance, element, _options, retry = true) {
    if (!isLoadImage()) return;
    options = _options;

    console.time("OpenCV耗时");
    let imageData = element.querySelector('#' + _options.imageDataDom);
    let inputImage = cv.imread(imageData, cv.IMREAD_GRAYSCALE);
    let points_vec = new cv.MatVector();
    let res = qrcode_detector.detectAndDecode(inputImage, points_vec);
    let i = 0
    let arr = []
    while (i < res.size()) {
        arr.push(res.get(i++))
    }
    res.delete()
    console.log(`检测到 ${arr.length} 个二维码:\r\n` + arr.join('\r\n'));
    instance.invokeMethodAsync('GetResult', `检测到 ${arr.length} 个二维码:\r\n` + arr.join('\r\n'));

    const rects = []
    let temp = inputImage
    if (arr.length > 0) {
        vibrate();
        for (let j = 0; j < points_vec.size(); j += 1) {
            let rect = cv.boundingRect(points_vec.get(j))
            rects.push(rect)

            let point1 = new cv.Point(rect.x, rect.y);
            let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
            cv.rectangle(temp, point1, point2, [255, 0, 0, 255]);
        }
    } else if (retry && options.retry) {
        let rect = new cv.Rect(temp.rows / 2, temp.rows / 2, temp.rows / 2, temp.rows / 2);
        temp = temp.roi(rect);
        cv.imshow(options.imageDataDom, temp);
        console.log(`取中间区域再试一次`);
        wechatQrcode452(instance, element, _options, false);
    }
    cv.imshow(_options.imageDataDom, temp)

    console.timeEnd("OpenCV耗时");
}


export function wechatQrcodeCamera(instance, element, _options) {
    options = _options;
    let utils = new Utils(instance, element, _options);

    let streaming = false;
    let videoInput = element.querySelector('#' + _options.videoInputDom);
    let startAndStop = element.querySelector('#' + _options.startAndStopDom);
    let canvasOutput = element.querySelector('#' + _options.imageDataDom);
    let src;
    let dst;
    let gray;
    let cap;
    let points_vec;
    const FPS = 30;
    canvasOutput.height = 0;
    canvasOutput.width = 0;
    let retry = true;
    utils.startCamera('vga', onVideoStarted, _options.videoInputDom, _options.deviceID, onChangeCamera);

    startAndStop.addEventListener('click', () => onToggleCamera());

    function onToggleCamera() {
        if (!streaming) {
            utils.clearError();
            utils.startCamera('vga', onVideoStarted, _options.videoInputDom, _options.deviceID, onChangeCamera);
        } else {
            utils.stopCamera();
            onVideoStopped();
        }
    }

    function processVideo() {
        try {
            if (!streaming) {
                // clean and stop.
                src.delete();
                dst.delete();
                gray.delete();
                return;
            }
            let begin = Date.now();
            // start processing.
            cap.read(src);
            //src.copyTo(dst);
            dst = cutImage(src, dst);
            cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
            let res = qrcode_detector.detectAndDecode(gray, points_vec);
            let i = 0
            let arr = []
            while (i < res.size()) {
                arr.push(res.get(i++))
            }
            //res.delete()
            console.log(`检测到 ${arr.length} 个二维码:\r\n` + arr.join('\r\n'));
            if (arr.length > 0) {
                instance.invokeMethodAsync('GetResult', `检测到 ${arr.length} 个二维码:\r\n` + arr.join('\r\n'));
                vibrate();
                const rects = []
                let temp = dst
                for (let j = 0; j < points_vec.size(); j += 1) {
                    let rect = cv.boundingRect(points_vec.get(j))
                    rects.push(rect)

                    let point1 = new cv.Point(rect.x, rect.y);
                    let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
                    cv.rectangle(temp, point1, point2, [255, 0, 0, 255]);
                }
                cv.imshow(_options.imageDataDom, temp)
            } else if (options.retry) {
                let rect = new cv.Rect(gray.rows / 4, gray.rows / 4, gray.rows / 2, gray.rows / 2);
                gray = gray.roi(rect);
                cv.imshow(options.imageDataDom, gray);
                console.log(`取中间区域再试一次`);
                res = qrcode_detector.detectAndDecode(gray, points_vec);
                i = 0
                arr = []
                while (i < res.size()) {
                    arr.push(res.get(i++))
                }
                console.log(`检测到 ${arr.length} 个二维码:\r\n` + arr.join('\r\n'));
                if (arr.length > 0) {
                    instance.invokeMethodAsync('GetResult', `检测到 ${arr.length} 个二维码:\r\n` + arr.join('\r\n'));
                    vibrate();
                    const rects = []
                    let temp = dst
                    for (let j = 0; j < points_vec.size(); j += 1) {
                        let rect = cv.boundingRect(points_vec.get(j))
                        rects.push(rect)

                        let point1 = new cv.Point(rect.x, rect.y);
                        let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
                        cv.rectangle(temp, point1, point2, [255, 0, 0, 255]);
                    }
                    cv.imshow(_options.imageDataDom, temp)
                }
            }
            // schedule the next one.
            let delay = 1000 / FPS - (Date.now() - begin);
            setTimeout(processVideo, delay);
        } catch (err) {
            utils.printError(err);
            if (retry) {
                retry = false;
                setTimeout(onToggleCamera(), 100);
                setTimeout(onToggleCamera(), 0);
            }
        }
    };

    function onVideoStarted() {
        src = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);
        dst = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC1);
        gray = new cv.Mat();
        cap = new cv.VideoCapture(videoInput);
        points_vec = new cv.MatVector();

        streaming = true;
        startAndStop.innerText = 'Stop';
        videoInput.width = videoInput.videoWidth;
        videoInput.height = videoInput.videoHeight;
        setTimeout(processVideo, 0);
        instance.invokeMethodAsync('GetCameraBusy', true);

    }

    function onChangeCamera(selectedDeviceId) {
        utils.stopCamera();
        _options.deviceID = selectedDeviceId;
        utils.startCamera('vga', onVideoStarted, _options.videoInputDom, _options.deviceID, onChangeCamera);
    }

    function onVideoStopped() {
        streaming = false;
        canvasOutput.height = 0;
        canvasOutput.width = 0;
        startAndStop.innerText = 'Start';
        instance.invokeMethodAsync('GetCameraBusy', false);
    }

}
