using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UploadHandle
{
    /// <summary>
    /// 上传处理 过程中 错误信息定义
    /// </summary>
    public class ErrorInfo
    {
        /// <summary>
        /// 状态标识 0
        /// </summary>
        public int status { get; set; } = 0;

        /// <summary>
        /// 文件名
        /// </summary>
        public string newName { get; set; }
        /// <summary>
        /// 服务器相对 目录
        /// </summary>
        public string relativeName { get; set; }

        /// <summary>
        /// 错误内容
        /// </summary>
        public string msg { get; set; }

        /// <summary>
        /// 构造 函数
        /// </summary>
        /// <param name="ex"></param>
        public ErrorInfo(Exception ex)
        {
            this.msg = ex.Message;
        }
        /// <summary>
        /// 详细构造信息
        /// </summary>
        /// <param name="file">文件信息</param>
        /// <param name="ex">错误信息</param>
        public ErrorInfo(UploadInfo file, Exception ex) : this(ex)
        {
            if (file != null)
            {
                this.newName = file.NewName;
                this.relativeName = file.GetRelativeName();
            }
        }

        //public override string ToString()
        //{
        //    return base.ToString();
        //}
    }
}
