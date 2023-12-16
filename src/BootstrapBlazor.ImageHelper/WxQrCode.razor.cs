// ********************************** 
// Densen Informatica 中讯科技 
// 作者：Alex Chow
// e-mail:zhouchuanglin@gmail.com 
// **********************************

using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.Options;
using Microsoft.JSInterop;
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.Net.Http;

namespace BootstrapBlazor.Components;

/// <summary>
/// WxQrCode 微信扫码 组件基类
/// </summary>
public partial class WxQrCode : IAsyncDisposable
{
    [Inject]
    [NotNull]
    private IJSRuntime? JSRuntime { get; set; }

    [Inject]
    [NotNull]
    private HttpClient? HttpClient  { get; set; }

    private IJSObjectReference? Module { get; set; }

    private DotNetObjectReference<WxQrCode>? Instance { get; set; }

    /// <summary>
    /// UI界面元素的引用对象
    /// </summary>
    public ElementReference Element { get; set; }

    [Parameter]
    public ElementReference CanvasElement { get; set; }

    /// <summary>
    /// 条码生成(svg)回调方法/ Barcode generated(svg) callback method
    /// </summary>
    [Parameter]
    public Func<string, Task>? OnResult { get; set; }

    /// <summary>
    /// 错误回调方法/Error callback method
    /// </summary>
    [Parameter]
    public Func<string, Task>? OnError { get; set; }

    /// <summary>
    /// 452 可以画框, 455没编译画框
    /// </summary>
    [Parameter]
    public int Ver { get; set; }

    private bool IsOpenCVReady { get; set; }
    private string Status => IsOpenCVReady ? "初始化完成" : "正在初始化...";
    private string? Message { get; set; } 

    private bool FirstRender { get; set; } = true;

    [NotNull]
    private StorageService? Storage { get; set; }

    /// <summary>
    /// 选择设备按钮文本/Select device button title
    /// </summary>
    [Parameter]
    public string SelectDeviceBtnTitle { get; set; } = "选择设备";

    /// <summary>
    /// 选项
    /// </summary>
    [Parameter]
    public WxQrCodeOption Options { get; set; }=new();

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        try
        {
            if (!firstRender) return;
            Storage ??= new StorageService(JSRuntime);
            Module = await JSRuntime.InvokeAsync<IJSObjectReference>("import", "./_content/BootstrapBlazor.ImageHelper/WxQrCode.razor.js" + "?v=" + System.Reflection.Assembly.GetExecutingAssembly().GetName().Version);
            Instance = DotNetObjectReference.Create(this);
            try
            {
                if (Options.SaveDeviceID)
                    Options.DeviceID = await Storage.GetValue("CamsDeviceID", Options.DeviceID);
            }
            catch (Exception)
            {
            }
            await Init();
            FirstRender = false;

        }
        catch (Exception e)
        {
            Message=e.Message;
            StateHasChanged();
            if (OnError != null) await OnError.Invoke(e.Message);
        }

    }

    protected override async Task OnParametersSetAsync()
    {
        if (FirstRender) return;
        await Apply();
    }

    [JSInvokable]
    public async Task GetReady()
    {
        IsOpenCVReady = true;
        StateHasChanged();
        if (OnResult != null)
            await OnResult.Invoke(Status); 
    }

    [JSInvokable]
    public async Task GetError(string err)
    {
        if (OnError != null) await OnError.Invoke(err);
    }

    /// <summary>
    /// 生成条码/ Generate barcode
    /// </summary>
    /// <param name="input"></param>
    /// <param name="options"></param>
    /// <returns></returns>
    public async Task<bool> Init()
    {

        try
        {
            await Module!.InvokeVoidAsync("init", Instance, Element, Options);
            if (OnResult != null)
                await OnResult.Invoke(Status);
        }
        catch (Exception ex)
        {
            Message = ex.Message;
            StateHasChanged();
            System.Console.WriteLine(ex.Message);
        }
        return IsOpenCVReady;
    }

    private async Task OnChanged(SelectedItem item)
    {
       await Apply();
    }
     

    public virtual async Task Apply()
    {
        if (FirstRender) return;
        Message =string.Empty;
        try
        {
            await Module!.InvokeVoidAsync("wechatQrcode452", Instance, Element, Options);
        }
        catch (Exception ex)
        {
            Message = ex.Message;
            StateHasChanged();
            System.Console.WriteLine(ex.Message);
        }
    }

    public virtual async Task Scan()
    {
        if (FirstRender) return;
        Message =string.Empty;
        try
        {
            await Module!.InvokeVoidAsync("wechatQrcodeCamera", Instance, Element, Options);
        }
        catch (Exception ex)
        {
            Message = ex.Message;
            StateHasChanged();
            System.Console.WriteLine(ex.Message);
        }
    } 

    [JSInvokable]
    public async Task GetResult(string msg)
    {
        Message = msg;
        StateHasChanged();
        System.Console.WriteLine(msg);
        if (OnResult != null)
            await OnResult.Invoke(msg);
    }

    /// <summary>
    /// 选择摄像头回调方法
    /// </summary>
    /// <param name="base64encodedstring"></param>
    /// <returns></returns>
    [JSInvokable]
    public async Task SelectDeviceID(string deviceID)
    {
        try
        {
            if (Options.SaveDeviceID)
            {
                await Storage.SetValue("CamsDeviceID", deviceID);
            }
        }
        catch
        {
        }
    }

    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (Module is not null)
        {
            await Module.DisposeAsync();
        }
        Instance?.Dispose();
    }

    #region StorageService
    private class StorageService
    {
        private readonly IJSRuntime JSRuntime;

        public StorageService(IJSRuntime jsRuntime)
        {
            JSRuntime = jsRuntime;
        }

        public async Task SetValue<TValue>(string key, TValue value)
        {
            await JSRuntime.InvokeVoidAsync("eval", $"localStorage.setItem('{key}', '{value}')");
        }

        public async Task<TValue?> GetValue<TValue>(string key, TValue? def)
        {
            try
            {
                var cValue = await JSRuntime.InvokeAsync<TValue>("eval", $"localStorage.getItem('{key}');");
                return cValue ?? def;
            }
            catch
            {
                var cValue = await JSRuntime.InvokeAsync<string>("eval", $"localStorage.getItem('{key}');");
                if (cValue == null)
                    return def;

                var newValue = GetValueI<TValue>(cValue);
                return newValue ?? def;

            }
        }

        public static T? GetValueI<T>(string value)
        {
            TypeConverter converter = TypeDescriptor.GetConverter(typeof(T));
            if (converter != null)
            {
                return (T?)converter.ConvertFrom(value);
            }
            return default;
            //return (T)Convert.ChangeType(value, typeof(T));
        }

        public async Task RemoveValue(string key)
        {
            await JSRuntime.InvokeVoidAsync("eval", $"localStorage.removeItem('{key}')");
        }


    }
    #endregion

}
