let loadingQr = true;
let img = new Image();
let qrcode_detector;
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

export function init(instance, element, imageDataDom, canvasDom, url) {
    let preview = element.querySelector('#preview');
    let inCanvas = element.querySelector('#' + imageDataDom);
    let outCanvas = element.querySelector('#' + canvasDom);
    let inputElement = element.querySelector('#fileInput');

    inputElement.addEventListener('change', (e) => {
        img.src = URL.createObjectURL(e.target.files[0]);
    }, false);

    img.onload = function () {
        outCanvas.height = 0;
        outCanvas.width = 0;
        let previewCtx = preview.getContext('2d')
        previewCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 300, 300);
        //变形的拉伸才能用
        //let inCanvasCtx = inCanvas.getContext('2d')
        //inCanvasCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 400, 400);
        let mat = cv.imread(img);
        cv.imshow(imageDataDom, mat);
        mat.delete();
        wechatQrcode452(instance, element, imageDataDom, canvasDom);
    };

    addScript(url).then(
        () => {
            if (loadingQr) {
                let utils = new Utils('errorMessage');
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
            utils.printError("Failed to load " + OPENCV_URL);
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
export function Utils(errorOutputId) { // eslint-disable-line no-unused-vars
    let self = this;
    this.errorOutput = document.getElementById(errorOutputId);

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
        let scriptNode = document.getElementById(scriptId);
        let textArea = document.getElementById(textAreaId);
        if (scriptNode.type !== 'text/code-snippet') {
            throw Error('Unknown code snippet type');
        }
        textArea.value = scriptNode.text.replace(/^\n/, '');
    };

    this.addFileInputHandler = function (fileInputId, canvasId) {
        let inputElement = document.getElementById(fileInputId);
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

    this.startCamera = function (resolution, callback, videoId) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const constraints = {
                'qvga': { width: { exact: 320 }, height: { exact: 240 } },
                'vga': { width: { exact: 640 }, height: { exact: 480 } }
            };
            let video = document.getElementById(videoId);
            if (!video) {
                video = document.createElement('video');
            }

            let videoConstraint = constraints[resolution];
            if (!videoConstraint) {
                videoConstraint = true;
            }

            navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: false })
                .then(function (stream) {
                    video.srcObject = stream;
                    video.play();
                    self.video = video;
                    self.stream = stream;
                    self.onCameraStartedCallback = callback;
                    video.addEventListener('canplay', onVideoCanPlay, false);
                })
                .catch(function (err) {
                    self.printError('Camera Error: ' + err.name + ' ' + err.message);
                });
        }
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
 
export function wechatQrcode(instance, element, imageDataDom, canvasDom) {
    if (!isLoadImage()) return;

    console.time("OpenCV耗时");
    let imageData = element.querySelector('#' + imageDataDom);
    let inputImage = cv.imread(imageData, cv.IMREAD_GRAYSCALE);
    let dst = new cv.Mat();
    let points_vec = new cv.MatVector();
    let res = qrcode_detector.detectAndDecode(inputImage, points_vec);
    let i = 0
    let arr = []
    while (i < res.size()) {
        arr.push(res.get(i++))
    }
    //res.delete()
    console.log(`检测到 ${arr.length} 个二维码:\r\n` + arr.join('\r\n'));
    instance.invokeMethodAsync('GetResult', `检测到 ${arr.length} 个二维码:\r\n` + arr.join('\r\n'));

    //const rects = []
    //let temp = inputImage
    //for (let j = 0; j < points_vec.size(); j += 1) {
    //    let points = points_vec.get(0);
    //    let x = points.floatAt(0);
    //    let y = points.floatAt(1);
    //    let width = points.floatAt(4) - points.floatAt(0);
    //    let height = points.floatAt(5) - points.floatAt(1);
    //    let rect = new cv.Rect(x, y, width, height);
    //    rects.push(rect)

    //    let point1 = new cv.Point(rect.x, rect.y);
    //    let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
    //    //cv.rectangle(temp, point1, point2, [255, 0, 0, 255]);
    //}
    ////cv.imshow(imageDataDom, temp)
    //console.log(rects);

    if (res.size() !== 0) {
        let points = points_vec.get(0);
        let x = points.floatAt(0);
        let y = points.floatAt(1);
        let width = points.floatAt(4) - points.floatAt(0);
        let height = points.floatAt(5) - points.floatAt(1);
        let rect = new cv.Rect(x, y, width, height);
        dst = inputImage.roi(rect);
        cv.imshow(canvasDom, dst);
    } else {
        instance.invokeMethodAsync('GetResult', '未能识别'); 
    }
    console.timeEnd("OpenCV耗时");
}

export function wechatQrcode452(instance, element, imageDataDom, canvasDom) {
    if (!isLoadImage()) return;

    console.time("OpenCV耗时");
    let imageData = element.querySelector('#' + imageDataDom);
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
    cv.imshow(imageDataDom, temp)

    console.timeEnd("OpenCV耗时");
}


export function wechatQrcodeCamera(instance, element, imageDataDom, canvasDom) {
    let utils = new Utils('errorMessage');

    let streaming = false;
    let videoInput = document.getElementById('videoInput');
    let startAndStop = document.getElementById('startAndStop');
    let canvasOutput = document.getElementById(canvasDom);
    let canvasContext = canvasOutput.getContext('2d');

    let video = document.getElementById('videoInput');
    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
    let gray = new cv.Mat();
    let cap = new cv.VideoCapture(video);
    let points_vec = new cv.MatVector();
    const FPS = 30;

    utils.startCamera('qvga', onVideoStarted, 'videoInput');
    function processVideo() {
        try {
            if (!streaming) {
                // clean and stop.
                src.delete();
                dst.delete();
                gray.delete();
                faces.delete();
                faceCascade.delete();
                return;
            }
            let begin = Date.now();
            // start processing.
            cap.read(src);
            src.copyTo(dst);
            cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
            //gray = cv.imread(dst, cv.IMREAD_GRAYSCALE);
            let res = qrcode_detector.detectAndDecode(gray, points_vec);
            let i = 0
            let arr = []
            while (i < res.size()) {
                arr.push(res.get(i++))
            }
            //res.delete()
            console.log(`检测到 ${arr.length} 个二维码:\r\n` + arr.join('\r\n'));
            instance.invokeMethodAsync('GetResult', `检测到 ${arr.length} 个二维码:\r\n` + arr.join('\r\n'));
            // schedule the next one.
            let delay = 1000 / FPS - (Date.now() - begin);
            setTimeout(processVideo, delay);
        } catch (err) {
            utils.printError(err);
        }
    };


    function onVideoStarted() {
        streaming = true;
        //startAndStop.innerText = 'Stop';
        videoInput.width = videoInput.videoWidth;
        videoInput.height = videoInput.videoHeight;
        setTimeout(processVideo, 0);
    }

    function onVideoStopped() {
        streaming = false;
        canvasContext.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
        //startAndStop.innerText = 'Start';
    }

}
