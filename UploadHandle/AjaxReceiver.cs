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
    /// 服务端 接收文件 封装，此使用Ajax方式接收处理
    /// 注：单文件接收
    /// </summary>
    public class AjaxReceiver
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
        public AjaxReceiver()
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
        public AjaxReceiver(string subfolder) : base()
        {
            this.SubFolder = subfolder;
        }

        /// <summary>
        /// 接收文件，逻辑处理
        /// </summary>
        private void DoWork()
        {
            HttpRequest req = _Context.Request;
            //判断是否 有fileinfo，则代表创建文件
            string info = req["fileinfo"] as string;
            if (string.IsNullOrEmpty(info)==false)
            {
                //创建文件
                try
                {
                    UploadMsg upMsg = info.JsonDeserialezer<UploadMsg>();
                    if (upMsg == null)
                        throw new HttpException(500, "服务器接收文件信息json数据失败");
                    if (string.IsNullOrEmpty(this.SubFolder) == false)
                        upMsg.SubFolder = this.SubFolder;
                    this.file = new UploadInfo(upMsg);
                    //接收文件信息成功 
                    SendSuccess("接收文件信息,并创建问价成功");
                }
                catch (Exception ex)
                {
                    SendError(ex);
                }
            }
            else
            {
                //接收文件
                if (req.Files.Count <= 0)
                    throw new HttpException(500, "获取上传文件失败");
                HttpPostedFile _file = req.Files[0];
                string backInfo = req["backinfo"] as string;
                if (string.IsNullOrEmpty(backInfo))
                    throw new HttpException("获取文件信息失败");

                UploadMsg upMsg = backInfo.JsonDeserialezer<UploadMsg>();
                this.file = new UploadInfo(upMsg);
                //获取文件数据
                Stream stream = _file.InputStream;
                try
                {
                    byte[] dataOne = new byte[stream.Length];
                    stream.Read(dataOne, 0, dataOne.Length);
                    AppendFile(dataOne);
                }
                finally
                {
                    stream.Close();
                }
            }
        }

        /// <summary>
        /// 追加二进制数据到文件
        /// </summary>
        /// <param name="buffer"></param>
        /// <param name="curLength"></param>
        private void AppendFile(byte[] buffer)
        {
            string filename = this.file.GetRullName();
            try
            {
                FileStream fs = new FileStream(filename, FileMode.Append, FileAccess.Write);
                try
                {
                    fs.Write(buffer, 0, buffer.Length);
                    //累计写入数据大小
                    this.curLength = buffer.Length;
                    this.curSize += buffer.Length;
                }
                finally
                {
                    fs.Close();
                }
                //判断接收成功
                FileInfo info = new FileInfo(filename);
                if (info.Length >= this.file.ContentLength) //保存 成功
                {
                    //网客户端相应 成功
                    SendSuccess("接收文件完毕");
                    OnSuccess?.Invoke(this.file);
                }
                else
                    SendSuccess("正在接受...");
            }
            catch (Exception ex)
            {
                Exception thisEx = new Exception("服务器保存文件异常，" + ex.Message);
                if (OnError == null)
                    throw thisEx;
                else OnError(thisEx);
            }
        }

        /// <summary>
        /// 相应出错 信息
        /// </summary>
        /// <param name="ex"></param>
        private void SendError(Exception ex)
        {
            _Context.Response.ContentType = "application/json";
            _Context.Response.Write(new ErrorInfo(file, ex).ToJsonString());
        }
        /// <summary>
        /// 接收成功 相应
        /// </summary>
        /// <param name="msg"></param>
        public void SendSuccess(string msg)
        {
            _Context.Response.ContentType = "application/json";
            _Context.Response.Write(new SuccessInfo(this, msg).ToJsonString());
        }
    }
}
