let loading = true;
let img = new Image();
export function addScript(url) {

    let scriptsIncluded = false;

    let scriptTags = document.querySelectorAll('head > script');
    scriptTags.forEach(scriptTag => {
        if (scriptTag) {
            let srcAttribute = scriptTag.getAttribute('src');
            if (srcAttribute && srcAttribute.startsWith(url)) {
                scriptsIncluded = true;
                return true;
            }
        }
    });

    if (scriptsIncluded) { //防止多次向页面添加 JS 脚本.Prevent adding JS scripts to page multiple times.
        return true;
    }

    let script = document.createElement('script');
    script.src = url;
    script.defer = true;
    document.head.appendChild(script);
    return false;
}

export function drawPixels(canvasElement, imageBytes) {
    const canvasContext = canvasElement.getContext("2d");
    const canvasImageData = canvasContext.createImageData(canvasElement.width, canvasElement.height);
    canvasImageData.data.set(imageBytes);
    canvasContext.putImageData(canvasImageData, 0, 0);
}

export function init(instance, element, options, imageDataDom, canvasDom) {
    let inCanvas = element.querySelector('#' + imageDataDom);
    let inputElement = element.querySelector('#fileInput');

    inputElement.addEventListener('change', (e) => {
       img.src = URL.createObjectURL(e.target.files[0]);
    }, false);

    img.onload = function () {
        let inCanvasCtx = inCanvas.getContext('2d')
        inCanvasCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 400, 400);
        if (img.width !== 400 || img.height != 400) {
            inCanvas.toBlob(function (blob) {
                img.src = URL.createObjectURL(blob);
            })
        }
    };

    function onOpenCvReady() {
        instance.invokeMethodAsync('GetReady');
    }

    onOpenCvReady();
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

    const OPENCV_URL = 'opencv.js';
    this.loadOpenCv = function (onloadCallback) {
        let script = document.createElement('script');
        script.setAttribute('async', '');
        script.setAttribute('type', 'text/javascript');
        script.addEventListener('load', () => {
            if (cv.getBuildInformation) {
                console.log(cv.getBuildInformation());
                onloadCallback();
            }
            else {
                // WASM
                cv['onRuntimeInitialized'] = () => {
                    console.log(cv.getBuildInformation());
                    onloadCallback();
                }
            }
        });
        script.addEventListener('error', () => {
            self.printError('Failed to load ' + OPENCV_URL);
        });
        script.src = OPENCV_URL;
        let node = document.getElementsByTagName('script')[0];
        node.parentNode.insertBefore(script, node);
    };

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

    this.loadImageToCanvas = function (url, cavansId) {
        let canvas = document.getElementById(cavansId);
        let ctx = canvas.getContext('2d');
        let img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
        };
        img.src = url;
    };

    this.executeCode = function (textAreaId) {
        try {
            this.clearError();
            let code = document.getElementById(textAreaId).value;
            eval(code);
        } catch (err) {
            this.printError(err);
        }
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

//灰度化
export function grayscale(instance, element, imageDataDom, canvasDom) {
    if (!isLoadImage()) return;
    let imageData = element.querySelector('#' + imageDataDom);
    // 读取图像
    let src = cv.imread(imageData);
    let dst = new cv.Mat();
    // 灰度化
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    // 显示图像
    cv.imshow(canvasDom, dst);
    // 回收对象
    src.delete();
    dst.delete()
}

//边缘检测
export function edgeDetection(instance, element, imageDataDom, canvasDom) {
    if (!isLoadImage()) return;
    let imageData = element.querySelector('#' + imageDataDom);
    let src = cv.imread(imageData);
    let dst = new cv.Mat();

    // 灰度化
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    // 边缘检测
    cv.Canny(src, dst, 50, 100, 3, false);

    cv.imshow(canvasDom, dst);
    src.delete();
    dst.delete()
}

//特征点检测
export function featurePointDetection(instance, element, imageDataDom, canvasDom) {
    if (!isLoadImage()) return;
    let imageData = element.querySelector('#' + imageDataDom);
    let src = cv.imread(imageData);
    let dst = new cv.Mat();

    // 灰度化
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

    var orb = new cv.ORB();
    var keypoints = new cv.KeyPointVector();
    var descriptors = new cv.Mat();
    // 特征点
    orb.detect(src, keypoints)
    // 特征点的描述因子
    orb.compute(src, keypoints, descriptors)
    // 绘制特征点
    cv.drawKeypoints(src, keypoints, dst)

    cv.imshow(canvasDom, dst);
    src.delete();
    dst.delete()
}

//伪彩色
export function pseudoColor(instance, element, imageDataDom, canvasDom) {
    if (!isLoadImage()) return;
    let imageData = element.querySelector('#' + imageDataDom);
    let src = cv.imread(imageData);
    let dst = new cv.Mat();

    // 灰度化
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    // 伪彩色
    cv.applyColorMap(src, dst, cv.COLORMAP_JET);

    cv.imshow(canvasDom, dst);
    src.delete();
    dst.delete()
}

//图像阈值化
export function threshold(instance, element, imageDataDom, canvasDom) {
    if (!isLoadImage()) return;
    let imageData = element.querySelector('#' + imageDataDom);
    let src = cv.imread(imageData);
    let dst = new cv.Mat();

    // 灰度化
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    // 阈值化
    cv.threshold(src, dst, 177, 200, cv.THRESH_BINARY);

    cv.imshow(canvasDom, dst);
    src.delete();
    dst.delete()
}

//人脸检测
function onOpenUtilsReady() {
    let utils = new Utils('errorMessage');
    utils.loadOpenCv(() => {
        let faceCascadeFile = 'haarcascade_frontalface_default.xml';
        utils.createFileFromUrl(faceCascadeFile, faceCascadeFile, () => {
            document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
            loading = false;
        });
    });
}
function faceDetectionBase(instance, element, imageDataDom, canvasDom,type) {
    if (!isLoadImage()) return;
    if (loading) {
        let utils = new Utils('errorMessage');
        let faceCascadeFile = '_content/BootstrapBlazor.ImageHelper/haarcascade_frontalface_default.xml';
        utils.createFileFromUrl('haarcascade_frontalface_default.xml', faceCascadeFile, () => {
            loading = false;
            instance.invokeMethodAsync('GetResult', '加载模型文件完成');
            if (type === 1)
                faceDetection(instance, element, imageDataDom, canvasDom);
            else
                faceDetection1st(instance, element, imageDataDom, canvasDom); 
        });
        return instance.invokeMethodAsync('GetResult', '正在加载模型文件');
    }
}
export function faceDetection(instance, element, imageDataDom, canvasDom) {
    faceDetectionBase(instance, element, imageDataDom, canvasDom,1);
    let imageData = element.querySelector('#' + imageDataDom);
    let src = cv.imread(imageData);
    let gray = new cv.Mat();
    // 灰度化
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    var classifier = new cv.CascadeClassifier();
    // 加载人脸检测模型
    classifier.load('haarcascade_frontalface_default.xml');
    // 人脸检测
    var faces = new cv.RectVector();
    classifier.detectMultiScale(src, faces, 1.1, 3, 0);

    for (let i = 0; i < faces.size(); ++i) {
        let face = faces.get(i);
        let point1 = new cv.Point(face.x, face.y);
        let point2 = new cv.Point(face.x + face.width, face.y + face.height);
        cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
    }

    cv.imshow(canvasDom, src);
    src.delete();
    gray.delete()
    classifier.delete();
    faces.delete();
}

export function faceDetection1st(instance, element, imageDataDom, canvasDom) { 
    faceDetectionBase(instance, element, imageDataDom, canvasDom, 2); 
    let imageData = element.querySelector('#' + imageDataDom);
    let src = cv.imread(imageData); 
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    let faces = new cv.RectVector();
    let faceCascade = new cv.CascadeClassifier();
    // load pre-trained classifiers
    faceCascade.load('haarcascade_frontalface_default.xml');
    // // detect faces
    let msize = new cv.Size(0, 0);
    faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);
    for (let i = 0; i < faces.size(); ++i) {
        let roiGray = gray.roi(faces.get(i));
        let roiSrc = src.roi(faces.get(i));
        const offest = 0
        let point1 = new cv.Point(faces.get(i).x, faces.get(i));
        let point2 = new cv.Point(faces.get(i).x + faces.get(i).width,
            faces.get(i).y + faces.get(i).height);
        let dst = new cv.Mat();
        // You can try more different parameters
        let rect = new cv.Rect(faces.get(i).x, faces.get(i).y, faces.get(i).width, faces.get(i).height);
        dst = src.roi(rect);
        cv.imshow(canvasDom, dst);
        dst.delete();
        roiGray.delete();
        roiSrc.delete();
    }
    src.delete();
    gray.delete();
    faceCascade.delete();
    faces.delete();
}

////运动估计
//export function motionEstimation(instance, element, imageDataDom, canvasDom) {
//    let imageData = element.querySelector('#' + imageDataDom);
//    let src = cv.imread(imageData);
//    let dst = new cv.Mat();

//    // 灰度化
//    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

//    var prevImg = new cv.Mat();
//    var nextImg = new cv.Mat();
//    var flow = new cv.Mat();
//    // 读取图像
//    cv.imread('prev.png', prevImg);
//    cv.imread('next.png', nextImg);
//    // 运动估计
//    cv.calcOpticalFlowFarneback(prevImg, nextImg, flow, 0.5, 3, 15, 3, 5, 1.2, 0);
//    // 绘制运动轨迹
//    for (let y = 0; y < flow.rows; y += 5) {
//        for (let x = 0; x < flow.cols; x += 5) {
//            let flowVec = flow.data32F;
//            let point1 = new cv.Point(x, y);
//            let point2 = new cv.Point(Math.round(x + flowVec[2 * (y * flow.cols + x)]),
//                Math.round(y + flowVec[2 * (y * flow.cols + x) + 1]));
//            cv.arrowedLine(src, point1, point2, [255, 0, 0, 255]);
//        }
//    }

//    cv.imshow(canvasDom, src);
//    src.delete();
//    dst.delete()
//}

////目标识别
//export function objectRecognition(instance, element, imageDataDom, canvasDom) {
//let imageData = element.querySelector('#' + imageDataDom);
//    let src = cv.imread(imageData);
//    let dst = new cv.Mat();

//    // 灰度化
//    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

//    var classifier = new cv.CascadeClassifier();
//    // 加载目标识别模型
//    classifier.load('haarcascade_frontalface_default.xml');
//    // 目标识别
//    var objects = new cv.RectVector();
//    classifier.detectMultiScale(src, objects, 1.1, 3, 0);

//    for (let i = 0; i < objects.size(); ++i) {
//        let object = objects.get(i);
//        let point1 = new cv.Point(object.x, object.y);
//        let point2 = new cv.Point(object.x + object.width, object.y + object.height);
//        cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
//    }

//    cv.imshow(canvasDom, src);
//    src.delete();
//    dst.delete()
//}

////图像分割
//export function imageSegmentation(instance, element, imageDataDom, canvasDom) {
//    let imageData = element.querySelector('#' + imageDataDom);
//    let src = cv.imread(imageData);
//    let dst = new cv.Mat();

//    // 灰度化
//    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

//    var dst = new cv.Mat();
//    // 图像分割
//    cv.threshold(src, dst, 177, 200, cv.THRESH_BINARY);

//    cv.imshow(canvasDom, dst);
//    src.delete();
//    dst.delete()
//}

////运动跟踪
//export function motionTracking(instance, element, imageDataDom, canvasDom) {
//    let imageData = element.querySelector('#' + imageDataDom);
//    let src = cv.imread(imageData);
//    let dst = new cv.Mat();

//    // 灰度化
//    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

//    var prevImg = new cv.Mat();
//    var nextImg = new cv.Mat();
//    var flow = new cv.Mat();
//    // 读取图像
//    cv.imread('prev.png', prevImg);
//    cv.imread('next.png', nextImg);
//    // 运动估计
//    cv.calcOpticalFlowFarneback(prevImg, nextImg, flow, 0.5, 3, 15, 3, 5, 1.2, 0);
//    // 绘制运动轨迹
//    for (let y = 0; y < flow.rows; y += 5) {
//        for (let x = 0; x < flow.cols; x += 5) {
//            let flowVec = flow.data32F;
//            let point1 = new cv.Point(x, y);
//            let point2 = new cv.Point(Math.round(x + flowVec[2 * (y * flow.cols + x)]),
//                Math.round(y + flowVec[2 * (y * flow.cols + x) + 1]));
//            cv.arrowedLine(src, point1, point2, [255, 0, 0, 255]);
//        }
//    }

//    cv.imshow(canvasDom, src);
//    src.delete();
//    dst.delete()
//}

////增强现实
//export function augmentedReality(instance, element, imageDataDom, canvasDom) {
//    let imageData = element.querySelector('#' + imageDataDom);
//    let src = cv.imread(imageData);
//    let dst = new cv.Mat();

//    // 灰度化
//    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

//    var dst = new cv.Mat();
//    // 图像分割
//    cv.threshold(src, dst, 177, 200, cv.THRESH_BINARY);

//    cv.imshow(canvasDom, dst);
//    src.delete();
//    dst.delete()
//}
