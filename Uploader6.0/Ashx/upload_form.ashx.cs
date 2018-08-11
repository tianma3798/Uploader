using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using UploadHandle;

namespace Uploader6._0.Ashx
{
    /// <summary>
    /// upload_form 的摘要说明
    /// </summary>
    public class upload_form : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            //var req = context.Request;
            //if (req.Files.Count > 0)
            //{
            //    //保存文件
            //    HttpPostedFile file = req.Files[0];
            //    file.SaveAs(@"I:\" + file.FileName);
            //    context.Response.ContentType = "text/plain";
            //    context.Response.Write("文件接收成功");
            //}


            LogHelper.LogHelper _log = new LogHelper.LogHelper();
            FormReceiver _receive = new FormReceiver();
            //接收文件成功
            _receive.OnSuccess = (data) =>
            {
                //此处，有需要的情况下，执行数据库操作
                _log.WriteLine(string.Format("新文件名{0},旧文件名{1}", data.NewName, data.OldName));
            };
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