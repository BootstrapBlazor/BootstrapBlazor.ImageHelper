// ********************************** 
// Densen Informatica 中讯科技 
// 作者：Alex Chow
// e-mail:zhouchuanglin@gmail.com 
// **********************************

using System.ComponentModel;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace BootstrapBlazor.Components;

/// <summary>
/// 类型
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EnumImageType
{
    灰度化,
    边缘检测,
    特征点检测,
    运动估计,
    人脸识别,
    目标识别,
    图像分割,
    运动跟踪,
    增强现实
}
 
