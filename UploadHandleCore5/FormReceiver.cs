using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace UploadHandle
{
    /// <summary>
    /// 服务端 接收文件 封装，此使用Form表单提交方式接收处理
    /// 注：单文件接收
    /// </summary>
    public class FormReceiver
    {
        /// <summary>
        /// 当前上传 文件对象
        /// </summary>
        public UploadInfo file = null;
        /// <summary>
        /// 当前保存 成功的文件大小
        /// </summary>
        public long curSize = 0;
        /// <summary>
        /// 已经接收的文件大小
        /// </summary>
        public long curLength = 0;
        /// <summary>
        /// 调用者指定的子文件夹
        /// </summary>
        public string SubFolder { get; set; }
        /// <summary>
        /// 请求上下文 独享 
        /// </summary>
        private HttpContext _Context = null;

        /// <summary>
        /// 接收文件成功后，触发
        /// </summary>
        public Action<SuccessInfo> OnSuccess = null;
        /// <summary>
        /// 接收文件失败，触发
        /// </summary>
        public Action<Exception> OnError = null;
        /// <summary>
        /// 默认 构造 处理
        /// </summary>
        public FormReceiver(HttpContext context)
        {
            _Context = context;
        }
        /// <summary>
        /// 指定子文件夹，接收处理
        /// </summary>
        /// <param name="subfolder"></param>
        public FormReceiver(HttpContext context, string subfolder) : this(context)
        {
            this.SubFolder = subfolder;
        }
        /// <summary>
        /// 接收文件，逻辑处理
        /// </summary>
        public async Task DoWork()
        {
            HttpRequest req = _Context.Request;
            //创建文件
            try
            {
                //接收文件
                if (req.Form.Files.Count <= 0)
                    throw new Exception("获取上传文件失败");
                IFormFile _file = req.Form.Files[0];
                string backInfo = req.Form["backinfo"];
                if (string.IsNullOrEmpty(backInfo))
                    throw new Exception("获取文件信息失败");
                UploadMsg upMsg = backInfo.JsonDeserialize<UploadMsg>();
                if (upMsg == null)
                    throw new Exception("服务器接收文件信息json数据失败");
                if (string.IsNullOrEmpty(this.SubFolder) == false)
                    upMsg.SubFolder = this.SubFolder;
                if (string.IsNullOrEmpty(upMsg.OldName))
                    upMsg.OldName = _file.FileName;

                this.file = new UploadInfo(upMsg);
                using (FileStream fs = new FileStream(this.file.GetFullName(), FileMode.OpenOrCreate, FileAccess.Write))
                {
                    Stream reader = _file.OpenReadStream();
                    byte[] list = new byte[reader.Length];
                    await reader.ReadAsync(list, 0, list.Length);
                    reader.Close();

                    await fs.WriteAsync(list, 0, list.Length);
                    fs.Close();
                    fs.Dispose();
                }
                //接收文件信息成功 
                 SendSuccess("接收文件信息,并创建问价成功");
            }
            catch (Exception ex)
            {
                 SendError(ex);
            }
        }
        /// <summary>
        /// 相应出错 信息
        /// </summary>
        /// <param name="ex"></param>
        private void SendError(Exception ex)
        {
            _Context.Response.ContentType = "application/json";
            string result = new ErrorInfo(file, ex).ToJson();
            byte[] data = UTF8Encoding.Default.GetBytes(result);
            _Context.Response.Body.WriteAsync(data, 0, data.Length);
        }
        /// <summary>
        /// 接收成功 相应
        /// </summary>
        /// <param name="msg"></param>
        public void SendSuccess(string msg)
        {
            _Context.Response.ContentType = "application/json";
            SuccessInfo result = new SuccessInfo(this, msg);
            if (OnSuccess != null)
                OnSuccess(result);
            byte[] data = UTF8Encoding.Default.GetBytes(result.ToJson());
            _Context.Response.Body.WriteAsync(data, 0, data.Length);
        }

    }
}
