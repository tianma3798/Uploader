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
/// ����http����
/// </summary>
void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    //MvcContext.Accessor = app.ApplicationServices.GetRequiredService<IHttpContextAccessor>();
    //AccountHelper.IsDevelement = env.IsDevelopment();
    if (env.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }
    //���þ�̬�ļ�
    app.UseStaticFiles();
    app.UseRouting();
    //���ÿ���
    app.UseCors();
    #region �󶨴�ӡ����
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
    #region ���ϴ�
    //��WebSocket�������ճɹ�����������ͼ
    UploadHandle.ServerInfo.SitePath = env.WebRootPath; //ʹ��wwwroot��Ϊ��Ŀ¼
    app.Map("/upload/common", (con) =>
    {
        con.UseWebSockets();//����webscoket
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