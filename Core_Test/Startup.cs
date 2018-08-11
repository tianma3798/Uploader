using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using UploadHandle;
using Core_Test.Controllers;

namespace Core_Test
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
            services.AddMvc();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseBrowserLink();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseStaticFiles();



            //配置上传
            UploadHandle.ServerInfo.SitePath = env.WebRootPath; //使用wwwroot作为根目录

            //绑定WebScoket处理
            // app.Map("/common/socket", UploadHandle.Receiver.Map);

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
                        CommonController.Write("大图位置：" + big);

                        //小图
                        _thumb.Width = 320;
                        _thumb.Folder = "small";
                        _thumb.AutoHandle();
                        string small = _thumb.GetRelativeName();
                        CommonController.Write("小图位置：" + small);

                        data.Data = new { big = big, small = small };

                        //此处，有需要的情况下，执行数据库操作
                        CommonController.Write(string.Format("新文件名{0},旧文件名{1}", data.NewName, data.OldName));
                    };
                    return _receive.DoWork();
                });
            });


            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
