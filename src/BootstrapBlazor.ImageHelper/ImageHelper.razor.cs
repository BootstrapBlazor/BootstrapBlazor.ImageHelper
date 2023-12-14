// ********************************** 
// Densen Informatica 中讯科技 
// 作者：Alex Chow
// e-mail:zhouchuanglin@gmail.com 
// **********************************

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Diagnostics.CodeAnalysis;

namespace BootstrapBlazor.Components;

/// <summary>
/// ImageHelper 图像助手 组件基类
/// </summary>
public partial class ImageHelper : IAsyncDisposable
{
    [Inject]
    [NotNull]
    private IJSRuntime? JSRuntime { get; set; }

    private IJSObjectReference? Module { get; set; }
    private DotNetObjectReference<ImageHelper>? Instance { get; set; }

    /// <summary>
    /// UI界面元素的引用对象
    /// </summary>
    public ElementReference Element { get; set; }

    [Parameter]
    public ImageHelperOption Options { get; set; } = new();

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

    private bool IsOpenCVReady { get; set; }
    private string Status => IsOpenCVReady ? "OpenCV is ready" : "OpenCV is loading...";

    private bool FirstRender { get; set; } = true;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        try
        {
            if (!firstRender) return;
            Instance = DotNetObjectReference.Create(this);
            Module = await JSRuntime.InvokeAsync<IJSObjectReference>("import", "./_content/BootstrapBlazor.ImageHelper/ImageHelper.razor.js" + "?v=" + System.Reflection.Assembly.GetExecutingAssembly().GetName().Version);
            while (!await AddScript())
            {
                await Task.Delay(500);
            }
            FirstRender = false;
            await Init();

        }
        catch (Exception e)
        {
            if (OnError != null) await OnError.Invoke(e.Message);
        }

    }
    public async Task<bool> AddScript() => await Module!.InvokeAsync<bool>("addScript", "/_content/BootstrapBlazor.ImageHelper/opencv.js");

    protected override async Task OnParametersSetAsync()
    {
        if (FirstRender) return;
        await Init();
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
    public async Task<bool> Init(string? input = null, ImageHelperOption? options = null)
    {
        if (options != null)
            Options = options;

        try
        {
            IsOpenCVReady = await Module!.InvokeAsync<bool>("init", Instance, Element, Options, ImageDataDom, CanvasDom);
            if (OnResult != null)
                await OnResult.Invoke(Status);
        }
        catch (Exception ex)
        {
            System.Console.WriteLine(ex.Message);
        }
        return IsOpenCVReady;
    }

    [Parameter]
    public string ImageDataDom { get; set; } = "imageSrc";

    [Parameter]
    public string CanvasDom { get; set; } = "canvasOutput";


    public virtual async Task 灰度化()
    {
        try
        {
            await Module!.InvokeVoidAsync("imgProcess1", Instance, Element, ImageDataDom, CanvasDom);
        }
        catch
        {
        }
    }

    public virtual async Task 边缘检测()
    {
        try
        {
            await Module!.InvokeVoidAsync("imgProcess2", Instance, Element, ImageDataDom, CanvasDom);
        }
        catch
        {
        }
    }

    public virtual async Task 特征点检测()
    {
        try
        {
            await Module!.InvokeVoidAsync("imgProcess3", Instance, Element, ImageDataDom, CanvasDom);
        }
        catch
        {
        }
    }

    [JSInvokable]
    public async Task GetResult(string err)
    {
        if (OnResult != null)
            await OnResult.Invoke(err);
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
