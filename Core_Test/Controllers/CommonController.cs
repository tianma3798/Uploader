using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using UploadHandle;
using System.IO;
namespace Core_Test.Controllers
{
    public class CommonController : Controller
    {
        public void Ajax()
        {
AjaxReceiver _receive = new AjaxReceiver(this.HttpContext);
//接收文件成功
_receive.OnSuccess = (data) =>
{
    Write(string.Format("新文件名{0},旧文件名{1}", data.NewName, data.OldName));
};
_receive.DoWork();
        }
        public void Ajax_Thumb()
        {
            try
            {
                AjaxReceiver _receive = new AjaxReceiver(this.HttpContext, "imgsouce/origin");
                //接收文件成功
                _receive.OnSuccess = (data) =>
                {
                    //接收文件成功后，自动生成缩略图
                    // 大图
                    ThumbnailHandle _thumb = new ThumbnailHandle(data, "big", 920);
                    _thumb.AutoHandle();
                    string big = _thumb.GetRelativeName();
                    Write("大图位置：" + big);

                    //小图
                    _thumb.Width = 320;
                    _thumb.Folder = "small";
                    _thumb.AutoHandle();
                    string small = _thumb.GetRelativeName();
                    Write("小图位置：" + small);

                    data.Data = new { big = big, small = small };

                    //此处，有需要的情况下，执行数据库操作
                    Write(string.Format("新文件名{0},旧文件名{1}", data.NewName, data.OldName));
                };
                _receive.DoWork();
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public void Socket()
        {
            try
            {
                Receiver _receive = new Receiver(this.HttpContext);
                //接收文件成功
                _receive.OnSuccess = (data) =>
                {
                    Write(string.Format("新文件名{0},旧文件名{1}", data.NewName, data.OldName));
                };
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public static void Write(string str)
        {
            string filename = @"e:\\log.txt";
            StreamWriter sw = new StreamWriter(filename);
            sw.WriteLine(DateTime.Now.ToLocalTime() + ":" + str);
            sw.Close();
        }
    }
}