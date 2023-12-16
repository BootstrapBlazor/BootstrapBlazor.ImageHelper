let loadingQr = true;
let img = new Image();
let qrcode_detector;
let element = null;
let instance = null;
let options = null;
let supportsVibrate = false;
let timeIds = -1;

export function init(_instance, _element, _options) {
    options = _options;
    instance = _instance;
    element = _element;
    supportsVibrate = "vibrate" in navigator;
    let inCanvas = element.querySelector('#' + options.imageDataDom);
    let outCanvas = element.querySelector('#' + options.canvasDom);
    let inputElement = element.querySelector('#' + options.fileInputDom);
    outCanvas.height = 0;
    outCanvas.width = 0;

    inputElement.addEventListener('change', (e) => {
        img.src = URL.createObjectURL(e.target.files[0]);
    }, false);

    img.onload = function () {
        outCanvas.height = 0;
        outCanvas.width = 0;
        //变形的拉伸才能用
        //let inCanvasCtx = inCanvas.getContext('2d')
        //inCanvasCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 400, 400);
        let mat = cv.imread(img);
        cv.imshow(options.imageDataDom, mat);
        mat.delete();
        wechatQrcode452(instance, element, _options);
    };

    addScript(options.openCvUrl).then(
        () => {
            if (loadingQr) {
                let utils = new Utils(options.errorOutputDom);
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
                                instance.invokeMethodAsync('GetResult', '加载模型文件完成');
                                qrcode_detector = new cv.wechat_qrcode_WeChatQRCode(
                                    "detect.prototxt",
                                    "detect.caffemodel",
                                    "sr.prototxt",
                                    "sr.caffemodel"
                                );
                                //wechatQrcode(instance, element, imageDataDom, canvasDom);
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
export function vibrate() {
    if (supportsVibrate) navigator.vibrate(1000);
}

export function addScript(url) {
    return new Promise((resolve, reject) => {
        let script = document.createElement("script");
        script.setAttribute("async", "");
        script.setAttribute("type", "text/javascript");
        script.setAttribute("id", "opencvjs");
        script.addEventListener("load", async () => {
            if (cv.getBuildInformation) {
                console.log(cv.getBuildInformation());
                resolve();
            } else {
                // WASM
                if (cv instanceof Promise) {
                    cv = await cv;
                    console.log(cv.getBuildInformation());
                    resolve();
                } else {
                    cv["onRuntimeInitialized"] = () => {
                        console.log(cv.getBuildInformation());
                        resolve();
                    };
                }
            }
        });
        script.addEventListener("error", () => {
            reject();
        });
        script.src = url;
        let node = document.getElementsByTagName("script")[0];
        node.parentNode.insertBefore(script, node);
    });
}

function isLoadImage() {
    if (!img.src) {
        alert('请先上传图片')
        return false
    }
    return true
}

export function Utils(errorOutputId) { // eslint-disable-line no-unused-vars
    let self = this;
    let sourceSelect = null;
    let sourceSelectPanel = null;
    let selectedDeviceId = null;

    this.errorOutput = element.querySelector('#' + errorOutputId);

    this.createFileFromUrl = function (path, url, callback) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function (ev) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    let data = new Uint8Array(request.response);
                    cv.FS_createDataFile('/', path, data, true, false, false);
                    callback();
                } else {
                    self.printError('Failed to load ' + url + ' status: ' + request.status);
                }
            }
        };
        request.send();
    };

    this.clearError = function () {
        this.errorOutput.innerHTML = '';
    };

    this.printError = function (err) {
        if (typeof err === 'undefined') {
            err = '';
        } else if (typeof err === 'number') {
            if (!isNaN(err)) {
                if (typeof cv !== 'undefined') {
                    err = 'Exception: ' + cv.exceptionFromPtr(err).msg;
                }
            }
        } else if (typeof err === 'string') {
            let ptr = Number(err.split(' ')[0]);
            if (!isNaN(ptr)) {
                if (typeof cv !== 'undefined') {
                    err = 'Exception: ' + cv.exceptionFromPtr(ptr).msg;
                }
            }
        } else if (err instanceof Error) {
            err = err.stack.replace(/\n/g, '<br>');
        }
        this.errorOutput.innerHTML = err;
    };

    this.loadCode = function (scriptId, textAreaId) {
        let scriptNode = element.querySelector('#' + scriptId);
        let textArea = element.querySelector('#' + textAreaId);
        if (scriptNode.type !== 'text/code-snippet') {
            throw Error('Unknown code snippet type');
        }
        textArea.value = scriptNode.text.replace(/^\n/, '');
    };

    this.addFileInputHandler = function (fileInputId, canvasId) {
        let inputElement = element.querySelector('#' + fileInputId);
        inputElement.addEventListener('change', (e) => {
            let files = e.target.files;
            if (files.length > 0) {
                let imgUrl = URL.createObjectURL(files[0]);
                self.loadImageToCanvas(imgUrl, canvasId);
            }
        }, false);
    };

    function onVideoCanPlay() {
        if (self.onCameraStartedCallback) {
            self.onCameraStartedCallback(self.stream, self.video);
        }
    };

    this.startCamera = function (resolution, callback, videoId, selectedDeviceId, changeCameraCallback) {
        self.selectedDeviceId = selectedDeviceId;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            let constraints = {
                'qvga': { width: { exact: 320 }, height: { exact: 240 } },
                'vga': { width: { exact: 640 }, height: { exact: 480 } }
            };
            let video = element.querySelector('#' + videoId);
            if (!video) {
                video = document.createElement('video');
            }

            let videoConstraint = constraints[resolution];
            if (!videoConstraint) {
                videoConstraint = true;
            }
            if (selectedDeviceId != null || options.deviceID != null) {
                let deviceId = selectedDeviceId;
                if (deviceId == null) deviceId = options.deviceID;
                videoConstraint = {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: options.width },
                    height: { ideal: options.height },
                    facingMode: "environment",
                    focusMode: "continuous"
                }

            }

            navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: false })
                .then(function (stream) {
                    video.srcObject = stream;
                    video.play();
                    self.video = video;
                    self.stream = stream;
                    self.onCameraStartedCallback = callback;
                    video.addEventListener('canplay', onVideoCanPlay, false);

                    self.listCameras(changeCameraCallback);
                })
                .catch(function (err) {
                    self.printError('Camera Error: ' + err.name + ' ' + err.message);
                });
        }
    };


    this.listCameras = function (callback) {
        if (selectedDeviceId != null) return;
        navigator.mediaDevices.enumerateDevices()
            .then((devices) => {
                sourceSelect = element.querySelector('[data-action=' + options.sourceSelectDom + ']');
                sourceSelectPanel = element.querySelector('[data-action=' + options.sourceSelectPanelDom + ']');
                let videoInputDevices = [];
                devices.forEach((device) => {
                    if (device.kind === 'videoinput') {
                        videoInputDevices.push(device);
                    }
                });
                if (options.deviceID != null) {
                    selectedDeviceId = options.deviceID
                } else if (videoInputDevices.length > 1) {
                    selectedDeviceId = videoInputDevices[1].deviceId
                } else {
                    selectedDeviceId = videoInputDevices[0].deviceId
                }
                if (videoInputDevices.length > 1) {
                    sourceSelect.innerHTML = '';
                    devices.forEach((device) => {
                        if (device.kind === 'videoinput') {
                            if (options.debug) console.log(`${device.label} id = ${device.deviceId}`);
                            const sourceOption = document.createElement('option');
                            if (device.label === '') {
                                sourceOption.text = 'Camera' + (sourceSelect.length + 1);
                            } else {
                                sourceOption.text = device.label
                            }
                            sourceOption.value = device.deviceId
                            if (selectedDeviceId != null && device.deviceId == selectedDeviceId) {
                                sourceOption.selected = true;
                            }
                            sourceSelect.appendChild(sourceOption)
                        }
                    });

                    sourceSelect.onchange = () => {
                        selectedDeviceId = sourceSelect.value;
                        if (options.debug) console.log(`selectedDevice: ${sourceSelect.options[sourceSelect.selectedIndex].text} id = ${sourceSelect.value}`);
                        instance.invokeMethodAsync('SelectDeviceID', selectedDeviceId);
                        callback(selectedDeviceId);
                        //this.stopCamera();
                        //this.startCamera(selectedDeviceId);
                    }

                    sourceSelectPanel.style.display = 'block'

                }
            })
            .catch((err) => {
                console.error(`${err.name}: ${err.message}`);
            });
    };

    this.stopCamera = function () {
        if (this.video) {
            this.video.pause();
            this.video.srcObject = null;
            this.video.removeEventListener('canplay', onVideoCanPlay);
        }
        if (this.stream) {
            this.stream.getVideoTracks()[0].stop();
        }
    };
};

export function wechatQrcode452(instance, element, _options) {
    if (!isLoadImage()) return;

    console.time("OpenCV耗时");
    let imageData = element.querySelector('#' + _options.imageDataDom);
    let inputImage = cv.imread(imageData, cv.IMREAD_GRAYSCALE);
    let dst = new cv.Mat();
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
    for (let j = 0; j < points_vec.size(); j += 1) {
        let rect = cv.boundingRect(points_vec.get(j))
        rects.push(rect)

        let point1 = new cv.Point(rect.x, rect.y);
        let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
        cv.rectangle(temp, point1, point2, [255, 0, 0, 255]);
    }
    cv.imshow(_options.imageDataDom, temp)

    console.timeEnd("OpenCV耗时");
}


export function wechatQrcodeCamera(instance, element, _options) {
    let utils = new Utils(_options.errorOutputDom);

    let streaming = false;
    let videoInput = element.querySelector('#' + _options.videoInputDom);
    let startAndStop = element.querySelector('#' + _options.startAndStopDom);
    let canvasOutput = element.querySelector('#' + _options.canvasDom);
    let canvasContext = canvasOutput.getContext('2d');

    let video = element.querySelector('#' + _options.videoInputDom);
    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
    let gray = new cv.Mat();
    let cap = new cv.VideoCapture(video);
    let points_vec = new cv.MatVector();
    const FPS = 30;

    utils.startCamera('vga', onVideoStarted, _options.videoInputDom, _options.deviceID, onChangeCamera);

    startAndStop.addEventListener('click', () => {
        if (!streaming) {
            utils.clearError();
            utils.startCamera('vga', onVideoStarted, _options.videoInputDom, _options.deviceID, onChangeCamera);
        } else {
            utils.stopCamera();
            onVideoStopped();
        }
    });

    function processVideo() {
        try {
            if (!streaming) {
                // clean and stop.
                src.delete();
                dst.delete();
                gray.delete();
                qrcode_detector.delete(); 
                return;
            }
            let begin = Date.now();
            // start processing.
            cap.read(src);
            src.copyTo(dst);
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
            }
            // schedule the next one.
            let delay = 1000 / FPS - (Date.now() - begin);
            timeIds = setTimeout(processVideo, delay);
        } catch (err) {
            utils.printError(err);
        }
    };

    function onVideoStarted() {
        streaming = true;
        startAndStop.innerText = 'Stop';
        videoInput.width = videoInput.videoWidth;
        videoInput.height = videoInput.videoHeight;
        timeIds = setTimeout(processVideo, 0);
    }

    function onChangeCamera(selectedDeviceId) {
        utils.stopCamera();
        _options.deviceID = selectedDeviceId;
        utils.startCamera('vga', onVideoStarted, _options.videoInputDom, _options.deviceID, onChangeCamera);
    }

    function onVideoStopped() {
        streaming = false;
        canvasContext.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
        startAndStop.innerText = 'Start';
        clearTimeout(timeIds);
    }

}
