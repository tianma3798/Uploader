using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using UploadHandle;

namespace Uploader6._0.Ashx
{
    /// <summary>
    /// thumbnail 的摘要说明
    /// </summary>
    public class thumbnail : IHttpHandler
    {

        LogHelper.LogHelper _log = new LogHelper.LogHelper();
        public void ProcessRequest(HttpContext context)
        {
            try
            {
                Receiver _receive = new Receiver("imgsouce/origin");
                //接收文件成功
                _receive.OnSuccess = (data) =>
                {
                    //接收文件成功后，自动生成缩略图
                    // 大图
                    ThumbnailHandle _thumb = new ThumbnailHandle(data, "big", 920);
                    _thumb.AutoHandle();
                    string big = _thumb.GetRelativeName();
                    _log.WriteLine("大图位置：" + big);

                    //小图
                    _thumb.Width = 320;
                    _thumb.Folder = "small";
                    _thumb.AutoHandle();
                    string small = _thumb.GetRelativeName();
                    _log.WriteLine("小图位置：" + small);

                    data.Data = new { big = big, small = small };

                    //此处，有需要的情况下，执行数据库操作
                    _log.WriteLine(string.Format("新文件名{0},旧文件名{1}", data.NewName, data.OldName));
                };
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}