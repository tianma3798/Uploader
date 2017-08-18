using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using UploadHandle;
namespace Uploader6._0.Ashx
{
    /// <summary>
    /// upload 的摘要说明
    /// </summary>
    public class upload : IHttpHandler
    {

LogHelper.LogHelper _log = new LogHelper.LogHelper();
public void ProcessRequest(HttpContext context)
{
    Receiver _receive = new Receiver();
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