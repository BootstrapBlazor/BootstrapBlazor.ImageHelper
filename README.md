# Blazor ImageHelper 图像助手 组件  
# Blazor WxQrCode 微信扫码 组件

基于[OpenCV](https://opencv.org)的Blazor组件

示例:

https://www.blazor.zone/ImageHelpers

https://blazor.app1.es/ImageHelpers

使用方法:

1.nuget包

```BootstrapBlazor.ImageHelper```

2._Imports.razor 文件 或者页面添加 添加组件库引用

```@using BootstrapBlazor.Components```


3.razor页面
```
<ImageHelper />
<WxQrCode />
 
```

4.参数说明

|  类型   |  参数   | 说明  | 默认值  | 
|  ----  |  ----  | ----  | ----  | 
 
#### 介绍

opencv.js是opencv利用了emscripten将原本的C++版本编译成了WebAssembly，让js可以直接调用C++版本的opencv方法

<p>这是c++的库转wasm(运行在客户端) ,当然ssr也能用, 语法全部用opencv的c++版本, 由于本人精力有限, 不能一一封装所有的功能, 欢迎有兴趣的小伙伴一起<a href="https://github.com/densen2014/BootstrapBlazor.ImageHelper">[参与项目]</a></p>

参考资料:

1. 人脸识别 https://docs.opencv.org/4.x/d2/d99/tutorial_js_face_detection.html

2. 形状/轮廓的检测 https://oceanbloom.github.io/2021/10/12/%E3%80%90OpenCV%E5%85%A5%E9%97%A8%E3%80%91%E5%BD%A2%E7%8A%B6-%E8%BD%AE%E5%BB%93%E7%9A%84%E6%A3%80%E6%B5%8B/

3. 图像处理 https://docs.opencv.org/4.x/d2/df0/tutorial_js_table_of_contents_imgproc.html

4. 视频分析 https://docs.opencv.org/4.x/de/db6/tutorial_js_table_of_contents_video.html

5. 物体检测 https://docs.opencv.org/4.x/dc/d73/tutorial_js_table_of_contents_objdetect.html

6. 深度神经网络 https://docs.opencv.org/4.x/d0/db7/tutorial_js_table_of_contents_dnn.html

#### 更新历史


---
#### Blazor 组件

[条码扫描 ZXingBlazor](https://www.nuget.org/packages/ZXingBlazor#readme-body-tab)
[![nuget](https://img.shields.io/nuget/v/ZXingBlazor.svg?style=flat-square)](https://www.nuget.org/packages/ZXingBlazor) 
[![stats](https://img.shields.io/nuget/dt/ZXingBlazor.svg?style=flat-square)](https://www.nuget.org/stats/packages/ZXingBlazor?groupby=Version)

[图片浏览器 Viewer](https://www.nuget.org/packages/BootstrapBlazor.Viewer#readme-body-tab)

[手写签名 SignaturePad](https://www.nuget.org/packages/BootstrapBlazor.SignaturePad#readme-body-tab)

[定位/持续定位 Geolocation](https://www.nuget.org/packages/BootstrapBlazor.Geolocation#readme-body-tab)

[屏幕键盘 OnScreenKeyboard](https://www.nuget.org/packages/BootstrapBlazor.OnScreenKeyboard#readme-body-tab)

[百度地图 BaiduMap](https://www.nuget.org/packages/BootstrapBlazor.BaiduMap#readme-body-tab)

[谷歌地图 GoogleMap](https://www.nuget.org/packages/BootstrapBlazor.Maps#readme-body-tab)

[蓝牙和打印 Bluetooth](https://www.nuget.org/packages/BootstrapBlazor.Bluetooth#readme-body-tab)

[PDF阅读器 PdfReader](https://www.nuget.org/packages/BootstrapBlazor.PdfReader#readme-body-tab)

[文件系统访问 FileSystem](https://www.nuget.org/packages/BootstrapBlazor.FileSystem#readme-body-tab)

[光学字符识别 OCR](https://www.nuget.org/packages/BootstrapBlazor.OCR#readme-body-tab)

[电池信息/网络信息 WebAPI](https://www.nuget.org/packages/BootstrapBlazor.WebAPI#readme-body-tab)

[文件预览 FileViewer](https://www.nuget.org/packages/BootstrapBlazor.FileViewer#readme-body-tab)

[视频播放器 VideoPlayer](https://www.nuget.org/packages/BootstrapBlazor.VideoPlayer#readme-body-tab)

[图像裁剪 ImageCropper](https://www.nuget.org/packages/BootstrapBlazor.ImageCropper#readme-body-tab)

[条码生成器 BarcodeGenerator](https://www.nuget.org/packages/BootstrapBlazor.BarcodeGenerator#readme-body-tab)

[图像助手 ImageHelper](https://www.nuget.org/packages/BootstrapBlazor.ImageHelper#readme-body-tab)

#### AlexChow

[今日头条](https://www.toutiao.com/c/user/token/MS4wLjABAAAAGMBzlmgJx0rytwH08AEEY8F0wIVXB2soJXXdUP3ohAE/?) | [博客园](https://www.cnblogs.com/densen2014) | [知乎](https://www.zhihu.com/people/alex-chow-54) | [Gitee](https://gitee.com/densen2014) | [GitHub](https://github.com/densen2014)

