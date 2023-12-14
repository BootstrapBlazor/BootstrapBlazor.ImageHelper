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

export function init(instance, element, options, imageDataDom, canvasDom) {
    let imageData = element.querySelector('#'+imageDataDom);
    let inputElement = element.querySelector('#fileInput');

    inputElement.addEventListener('change', (e) => {
        imageData.src = URL.createObjectURL(e.target.files[0]);
    }, false);

    //imageData.onload = function () {
    //    let mat = cv.imread(imageData);
    //    let mat1 = mat.clone();
    //    mat.delete();
    //    let dst = new cv.Mat();
    //    console.log("Mat:", dst);
    //    cv.cvtColor(mat1, dst, cv.COLOR_RGBA2GRAY);
    //    cv.imshow(canvasDom, dst);
    //    console.log('cols =', mat1.cols, '; rows =', mat1.rows);
    //    mat1.delete();
    //    dst.delete();
    //};

    function onOpenCvReady() {
        document.querySelector('#' + 'status').innerHTML = 'OpenCV is ready.';
        instance.invokeMethodAsync('GetReady');
    }

    onOpenCvReady();
}

//灰度化
export function imgProcess1(instance, element, imageDataDom, canvasDom) {
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
export function imgProcess2(instance, element, imageDataDom, canvasDom) {
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
export function imgProcess3(instance, element, imageDataDom, canvasDom) {
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