// ********************************** 
// Densen Informatica 中讯科技 
// 作者：Alex Chow
// e-mail:zhouchuanglin@gmail.com 
// **********************************

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
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

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        try
        {
            if (!firstRender) return;
            Instance = DotNetObjectReference.Create(this);
            Module = await JSRuntime.InvokeAsync<IJSObjectReference>("import", "./_content/BootstrapBlazor.ImageHelper/WxQrCode.razor.js" + "?v=" + System.Reflection.Assembly.GetExecutingAssembly().GetName().Version);
            //while (!await AddScript())
            //{
            //    await Task.Delay(500);
            //}
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

    //452 可以画框, 455没编译画框
    public async Task<bool> AddScript() => await Module!.InvokeAsync<bool>("addScript", "/_content/BootstrapBlazor.ImageHelper/qr/opencv.js");

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
    public async Task<bool> Init(string? input = null)
    {

        try
        {
            await Module!.InvokeVoidAsync("init", Instance, Element, ImageDataDom, CanvasDom, "/_content/BootstrapBlazor.ImageHelper/qr/opencv452.js");
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

    [Parameter]
    public string ImageDataDom { get; set; } = "imageSrc";

    [Parameter]
    public ElementReference CanvasElement{ get; set; } 

    [Parameter]
    public string CanvasDom { get; set; } = "canvasOutput";

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
            await Module!.InvokeVoidAsync("wechatQrcode452", Instance, Element, ImageDataDom, CanvasDom);
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
            await Module!.InvokeVoidAsync("wechatQrcodeCamera", Instance, Element, ImageDataDom, CanvasDom);
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

    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (Module is not null)
        {
            await Module.DisposeAsync();
        }
        Instance?.Dispose();
    }

}
