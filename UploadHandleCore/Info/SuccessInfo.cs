using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UploadHandle
{
    /// <summary>
    /// 接收数据成功后，相应内容定义
    /// </summary>
    public class SuccessInfo
    {
        /// <summary>
        /// 成功标识 1
        /// </summary>
        public int status { get; set; } = 1;
        /// <summary>
        /// 新文件名
        /// </summary>
        public string newName { get; set; }
        /// <summary>
        /// 服务器相对 地址 
        /// </summary>
        public string relativeName { get; set; }
        /// <summary>
        /// 文件大小
        /// </summary>
        public long curSize { get; set; }
        /// <summary>
        /// 当前已经 接收的文件大小
        /// </summary>
        public long curLength { get; set; }
        /// <summary>
        /// 当前文件的大小
        /// </summary>
        public long size { get; set; }
        /// <summary>
        /// 消息备注
        /// </summary>
        public string msg { get; set; }
        /// <summary>
        /// 附加信息
        /// </summary>
        public object Data { get; set; }
        /// <summary>
        /// 后台处理类型
        /// </summary>
        public int handleType { get; set; }
        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="file"></param>
        public SuccessInfo(UploadInfo file)
        {
            this.newName = file.NewName;
            this.relativeName = file.GetRelativeName();
            this.size = file.ContentLength;
            this.Data = file.Data;
            this.handleType = file._UploadMsg.HandleType;
        }

        public SuccessInfo(AjaxReceiver rece,string msg) : this(rece.file)
        {
            this.curSize = rece.curSize;
            this.curLength = rece.curLength;
            this.msg = msg;
        }
    }
}
