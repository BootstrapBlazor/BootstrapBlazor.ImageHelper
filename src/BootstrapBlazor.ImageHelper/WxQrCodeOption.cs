// ********************************** 
// Densen Informatica 中讯科技 
// 作者：Alex Chow
// e-mail:zhouchuanglin@gmail.com 
// **********************************

using System.ComponentModel;

namespace BootstrapBlazor.Components;

/// <summary>
/// 选项
/// </summary>
public class WxQrCodeOption
{

    public string OpenCvUrl { get; set; } = "/_content/BootstrapBlazor.ImageHelper/qr/opencv452.js";

    public string CaptureDom { get; set; } = "captureInput";

    public string FileInputDom { get; set; } = "fileInput";

    public string ImageDataDom { get; set; } = "imageSrc";

    public string VideoInputDom { get; set; } = "videoInput";
    public string StartAndStopDom { get; set; } = "startAndStop";
    public string ErrorOutputDom { get; set; } = "errorMessage";
    public string SourceSelectDom { get; set; } = "sourceSelect";
    public string SourceSelectPanelDom { get; set; } = "sourceSelectPanel";

    /// <summary>
    /// 指定摄像头设备ID
    /// </summary>
    public string? DeviceID { get; set; }

    /// <summary>
    /// 保存最后使用设备ID下次自动调用
    /// </summary>
    public bool SaveDeviceID { get; set; } = true;

    /// <summary>
    /// 图像质量,默认为 0.9
    /// </summary>
    [DisplayName("图像质量")]
    public double Quality { get; set; } = 0.9d;

    /// <summary>
    /// 图像宽度,默认为 640
    /// </summary>
    [DisplayName("图像宽度")]
    public int Width { get; set; }= 640;

    /// <summary>
    /// 图像高度,默认为 480
    /// </summary>
    [DisplayName("图像高度")]
    public int Height { get; set; } = 480;

    /// <summary>
    /// 显示log
    /// </summary>
    [DisplayName("显示log")]
    public bool Debug { get; set; }

}
