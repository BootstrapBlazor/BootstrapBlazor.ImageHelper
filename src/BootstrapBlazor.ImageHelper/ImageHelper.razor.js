let loading = true;
let img = new Image();
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

export function drawPixels(canvasElement, imageBytes) {
    const canvasContext = canvasElement.getContext("2d");
    const canvasImageData = canvasContext.createImageData(canvasElement.width, canvasElement.height);
    canvasImageData.data.set(imageBytes);
    canvasContext.putImageData(canvasImageData, 0, 0);
}

export function init(instance, element, options, imageDataDom, canvasDom, url) {
    let inCanvas = element.querySelector('#' + imageDataDom);
    let inputElement = element.querySelector('#fileInput');

    if (inputElement) inputElement.addEventListener('change', (e) => {
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
    addScript(url).then(
        () => {

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
function faceDetectionBase(instance, element, imageDataDom, canvasDom, type) {
    if (type != 3 && !isLoadImage()) return false;
    if (loading) {
        let utils = new Utils('errorMessage');
        let baseurl = '_content/BootstrapBlazor.ImageHelper/models/';
        let eyeCascadeFile = 'haarcascade_eye.xml';
        utils.createFileFromUrl(eyeCascadeFile, baseurl + eyeCascadeFile, () => {
            let faceCascadeFile = 'haarcascade_frontalface_default.xml';
            utils.createFileFromUrl(faceCascadeFile, baseurl + faceCascadeFile, () => {
                loading = false;
                instance.invokeMethodAsync('GetResult', '加载模型文件完成');
                if (type === 1)
                    faceDetection(instance, element, imageDataDom, canvasDom);
                else if (type === 3)
                    faceDetectionInCamera(instance, element, imageDataDom, canvasDom);
                else
                    faceDetection1st(instance, element, imageDataDom, canvasDom);
            });
        });
        return instance.invokeMethodAsync('GetResult', '正在加载模型文件');
    }
    return true;
}
export function faceDetection(instance, element, imageDataDom, canvasDom) {
    if (!faceDetectionBase(instance, element, imageDataDom, canvasDom, 1)) return;
    let imageData = element.querySelector('#' + imageDataDom);
    let src = cv.imread(imageData);
    let gray = new cv.Mat();
    // 灰度化
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    let faces = new cv.RectVector();
    let eyes = new cv.RectVector();
    let faceCascade = new cv.CascadeClassifier();
    let eyeCascade = new cv.CascadeClassifier();
    // 加载人脸检测模型
    faceCascade.load('haarcascade_frontalface_default.xml');
    eyeCascade.load('haarcascade_eye.xml');
    let msize = new cv.Size(0, 0);
    // 人脸检测
    faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);
    for (let i = 0; i < faces.size(); ++i) {
        let roiGray = gray.roi(faces.get(i));
        let roiSrc = src.roi(faces.get(i));
        let point1 = new cv.Point(faces.get(i).x, faces.get(i).y);
        let point2 = new cv.Point(faces.get(i).x + faces.get(i).width,
            faces.get(i).y + faces.get(i).height);
        cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
        // detect eyes in face ROI
        eyeCascade.detectMultiScale(roiGray, eyes);
        for (let j = 0; j < eyes.size(); ++j) {
            let point1 = new cv.Point(eyes.get(j).x, eyes.get(j).y);
            let point2 = new cv.Point(eyes.get(j).x + eyes.get(j).width,
                eyes.get(j).y + eyes.get(j).height);
            cv.rectangle(roiSrc, point1, point2, [0, 0, 255, 255]);
        }
        roiGray.delete(); roiSrc.delete();
    }
    cv.imshow(canvasDom, src);
    src.delete(); gray.delete(); faceCascade.delete();
    eyeCascade.delete(); faces.delete(); eyes.delete();
}

export function faceDetection1st(instance, element, imageDataDom, canvasDom) {
    if (!faceDetectionBase(instance, element, imageDataDom, canvasDom, 2)) return;
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

export function faceDetectionInCamera(instance, element, imageDataDom, canvasDom) {
    if (!faceDetectionBase(instance, element, imageDataDom, canvasDom, 3)) return;
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
    let faces = new cv.RectVector();
    let faceCascade = new cv.CascadeClassifier();
    // load pre-trained classifiers
    faceCascade.load('haarcascade_frontalface_default.xml');
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
            // detect faces.
            faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0);
            // draw faces.
            for (let i = 0; i < faces.size(); ++i) {
                let face = faces.get(i);
                let point1 = new cv.Point(face.x, face.y);
                let point2 = new cv.Point(face.x + face.width, face.y + face.height);
                cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
            }
            cv.imshow(canvasDom, dst);
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
