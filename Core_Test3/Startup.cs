using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using UploadHandle;

namespace Core_Test3
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllersWithViews();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }
            app.UseStaticFiles();


            //配置上传
            UploadHandle.ServerInfo.SitePath = env.WebRootPath; //使用wwwroot作为根目录

            //绑定WebScoket处理 ,指定websocket 方式放在外边了
            app.Map("/common/socket", (con) =>
            {
                con.UseWebSockets();
                UploadHandle.Receiver.Map(con);
            });
            //绑定WebSocket处理，接收成功后，生成缩略图
            app.Map("/common/socket_thumb", (con) =>
            {
                con.UseWebSockets();//启用webscoket
                con.Use((ctx, n) =>
                {
                    Receiver _receive = new Receiver(ctx, "imgdata/origin");
                    _receive.OnSuccess += (data) =>
                    {
                        //接收文件成功后，自动生成缩略图
                        // 大图
                        ThumbnailHandle _thumb = new ThumbnailHandle(data, "big", 920);
                        _thumb.AutoHandle();
                        string big = _thumb.GetRelativeName();

                        //小图
                        _thumb.Width = 320;
                        _thumb.Folder = "small";
                        _thumb.AutoHandle();
                        string small = _thumb.GetRelativeName();

                        data.Data = new { big = big, small = small };

                        //此处，有需要的情况下，执行数据库操作
                    };
                    return _receive.DoWork();
                });
            });


            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
