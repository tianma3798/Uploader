using UploadHandle;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();
Configure(app, app.Environment);
// Configure the HTTP request pipeline.
//if (!app.Environment.IsDevelopment())
//{
//    app.UseExceptionHandler("/Home/Error");
//}
//app.UseStaticFiles();

//app.UseRouting();

//app.UseAuthorization();

//app.MapControllerRoute(
//    name: "default",
//    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();



/// <summary>
/// 配置http处理
/// </summary>
void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    //MvcContext.Accessor = app.ApplicationServices.GetRequiredService<IHttpContextAccessor>();
    //AccountHelper.IsDevelement = env.IsDevelopment();
    if (env.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }
    //启用静态文件
    app.UseStaticFiles();
    app.UseRouting();
    //启用跨域
    app.UseCors();
    #region 绑定打印处理
    app.UseWebSockets();
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllerRoute(
                 name: "default",
                 pattern: "{controller=Home}/{action=Index}/{id?}");
        endpoints.MapAreaControllerRoute(
          name: "api", "api",
          pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");

    });
    #endregion
    #region 绑定上传
    //绑定WebSocket处理，接收成功后，生成缩略图
    UploadHandle.ServerInfo.SitePath = env.WebRootPath; //使用wwwroot作为根目录
    app.Map("/upload/common", (con) =>
    {
        con.UseWebSockets();//启用webscoket
        con.Use(async (ctx, next) =>
        {
            Receiver _receive = new Receiver(ctx, "upload/images");
            _receive.OnSuccess += (data) =>
            {
            };
            _receive.OnError += (ex) =>
            {
                int i = 10;

            };

            await _receive.DoWork();
            await next.Invoke();
        });
    });
    #endregion
}