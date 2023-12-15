// ********************************** 
// Densen Informatica 中讯科技 
// 作者：Alex Chow
// e-mail:zhouchuanglin@gmail.com 
// **********************************

using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BootstrapBlazor.Components;

/// <summary>
/// 图像助手选项
/// </summary>
public class ImageHelperOption
{
    /// <summary>
    /// 功能
    /// </summary>
    [DisplayName("功能")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public EnumImageHelperFunc Type { get; set; } 

    /// <summary>
    /// 条码值 / Barcode value
    /// </summary>
    [DisplayName("条码值")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Value { get; set; }

    /// <summary>
    /// 单个条形的宽度,默认值：2 / Width,default: 2
    /// </summary>
    [DisplayName("宽度")]
    [Range(1, 6)]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int Width { get; set; } = 2;

    /// <summary>
    /// 条形码的高度,默认值：100 / Height,default: 100
    /// </summary>
    [DisplayName("高度")]
    [Range(10, 300)]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int Height { get; set; } = 100;

}
