using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;

namespace UploadHandle
{
    /// <summary>
    /// 服务端接收文件封装，此使用WebScoket方式接收文件
    /// </summary>
    public class Receiver
    {
        /// <summary>
        /// 当前上传文件对象
        /// </summary>
        private UploadInfo _file = null;
        /// <summary>
        /// 当前接收的scoket链接
        /// </summary>
        private WebSocket _socket = null;
        /// <summary>
        /// 当前接收的服务端缓存区最大大小 
        /// </summary>
        private int bufferSize = 1024 * 512;
        /// <summary>
        /// 当前保存成功的文件大小
        /// </summary>
        private long curSize = 0;
        /// <summary>
        /// 调用者指定的子文件夹
        /// </summary>
        public string SubFolder { get; set; }
        /// <summary>
        /// 当前请求上下文
        /// </summary>
        private HttpContext _Context = null;
        /// <summary>
        /// 当前接收文件成功后出发
        /// </summary>
        public Action<UploadInfo> OnSuccess = null;
        /// <summary>
        /// 当接收文件失败
        /// </summary>
        public Action<Exception> OnError = null;
        /// <summary>
        /// 构造函数
        /// </summary>
        public Receiver(HttpContext context)
        {
            //默认从当前上下文中创建socket链接
            _Context = context;
            if (_Context == null)
                throw new Exception("获取当前请求上线文失败");
        }
        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="subfolder">子文件夹</param>
        public Receiver(HttpContext context,string subfolder) : this(context)
        {
            this.SubFolder = subfolder;
        }
        /// <summary>
        /// socket监听方法
        /// </summary>
        /// <param name="arg">当前WebSocket上下文</param>
        /// <returns></returns>
        public async Task DoWork()
        {
            WebSocket _socket = await _Context.WebSockets.AcceptWebSocketAsync();
            this._socket = _socket;
            //监视相应
            while (true)
            {
                /*
                 * 接收客户端数据
                 */
                ArraySegment<byte> buffer = new ArraySegment<byte>(new byte[bufferSize]);
                CancellationToken token;
                WebSocketReceiveResult result = await _socket.ReceiveAsync(buffer, token);
                if (_socket.State == WebSocketState.Open)
                {
                    //当前数据大小
                    int curLength = Math.Min(buffer.Array.Length, result.Count);
                    //如果数据为json字符串，则为初次链接
                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        try
                        {
                            string msg = Encoding.UTF8.GetString(buffer.Array, 0, curLength);
                            UploadMsg upMsg = msg.JsonDeserialize<UploadMsg>();
                            if (upMsg == null)
                                throw new Exception( "服务器接收客户json数据失败");
                            if (string.IsNullOrEmpty(this.SubFolder) == false)
                                upMsg.SubFolder = this.SubFolder + "/" + upMsg.SubFolder;
                            _file = new UploadInfo(upMsg);
                            //接收文件信息成功
                            await SendSuccess("接收文件信息成功");
                        }
                        catch (Exception ex)
                        {
                            await SendError(ex);
                        }
                    }
                    else if (result.MessageType == WebSocketMessageType.Binary)
                    {
                        try
                        {
                            //保存上传数据追加到文件
                            AppendFile(buffer, curLength);
                            curSize += curLength;
                            //相应服务器保存文件大小
                            await SendSuccess("服务器保存进行中...", curLength);
                        }
                        catch (Exception ex)
                        {
                            await SendError(ex);
                        }
                    }
                }
                else { break; }
            }
        }
        private static object fileLock = new object();
        /// <summary>
        /// 追加二进制数据到文件
        /// </summary>
        /// <param name="buffer"></param>
        /// <param name="curLength"></param>
        private void AppendFile(ArraySegment<byte> buffer, int curLength)
        {
            string filename = _file.GetFullName();
            try
            {
                lock (fileLock)
                {
                    FileStream fs = new FileStream(filename, FileMode.Append, FileAccess.Write);
                    try
                    {
                        byte[] data = buffer.ToArray();
                        fs.Write(data, 0, curLength);
                    }
                    finally
                    {
                        fs.Close();
                        fs.Dispose();
                    }
                    FileInfo info = new FileInfo(filename);
                    if (info.Length >= _file.ContentLength)//保存文件成功
                    {
                        if (OnSuccess != null)
                            OnSuccess(_file);
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("服务保存文件异常，" + ex.Message);
            }
        }
        /// <summary>
        /// 相应接收成功消息
        /// </summary>
        /// <param name="msg"></param>
        /// <returns></returns>
        private async Task SendSuccess(string msg, int curLength = 0)
        {
            SuccessInfo result = new SuccessInfo(_file);
            result.curSize = curSize;
            result.curLength = curLength;
            result.msg = msg;
            ArraySegment<byte> data = new ArraySegment<byte>(Encoding.UTF8.GetBytes(result.ToJson()));
            await _socket.SendAsync(data, WebSocketMessageType.Text, true, CancellationToken.None);
        }
        /// <summary>
        /// 接收出现异常
        /// </summary>
        /// <param name="msg"></param>
        /// <returns></returns>
        private async Task SendError(Exception ex)
        {
            //触发异常
            if (OnError != null)
                OnError(ex);
            ErrorInfo result = new ErrorInfo(_file, ex);
            ArraySegment<byte> data = new ArraySegment<byte>(Encoding.UTF8.GetBytes(result.ToJson()));
            await _socket.SendAsync(data, WebSocketMessageType.Text, true, CancellationToken.None);
        }



        /// <summary>
        /// 路由绑定
        /// </summary>
        /// <param name="app"></param>
        public static void Map(IApplicationBuilder app)
        {
            app.UseWebSockets();
            app.Use(Acceptor);
        }
        /// <summary>
        /// 接收处理
        /// </summary>
        static async Task Acceptor(HttpContext ctx, Func<Task> n)
        {
            Receiver _receiver = new Receiver(ctx);
            await _receiver.DoWork();
        }
    }
}
