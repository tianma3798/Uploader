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
        public Action<UploadInfo> OnSuccess = null;
        /// <summary>
        /// 接收文件失败，触发
        /// </summary>
        public Action<Exception> OnError = null;
        /// <summary>
        /// 默认 构造 处理
        /// </summary>
        public FormReceiver()
        {
            _Context = HttpContext.Current;
            if (_Context == null)
                throw new HttpException(500, "获取当前请求 上下文失败");
            //接收文件
            this.DoWork();
        }
        /// <summary>
        /// 指定子文件夹，接收处理
        /// </summary>
        /// <param name="subfolder"></param>
        public FormReceiver(string subfolder) : base()
        {
            this.SubFolder = subfolder;
        }

        /// <summary>
        /// 接收文件，逻辑处理
        /// </summary>
        private void DoWork()
        {
            HttpRequest req = _Context.Request;
            //创建文件
            try
            {
                //接收文件
                if (req.Files.Count <= 0)
                    throw new HttpException(500, "获取上传文件失败");
                HttpPostedFile _file = req.Files[0];
                string backInfo = req["backinfo"] as string;
                if (string.IsNullOrEmpty(backInfo))
                    throw new HttpException("获取文件信息失败");
                UploadMsg upMsg = backInfo.JsonDese<UploadMsg>();
                if (upMsg == null)
                    throw new HttpException(500, "服务器接收文件信息json数据失败");
                if (string.IsNullOrEmpty(this.SubFolder) == false)
                    upMsg.SubFolder = this.SubFolder;
                if (string.IsNullOrEmpty(upMsg.OldName))
                    upMsg.OldName = _file.FileName;

                this.file = new UploadInfo(upMsg);
                _file.SaveAs(this.file.GetFullName());//保存图片处理

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
            _Context.Response.Write(new ErrorInfo(file, ex).ToJson());
        }
        /// <summary>
        /// 接收成功 相应
        /// </summary>
        /// <param name="msg"></param>
        public void SendSuccess(string msg)
        {
            _Context.Response.ContentType = "application/json";
            _Context.Response.Write(new SuccessInfo(this, msg).ToJson());
        }
    }
}
