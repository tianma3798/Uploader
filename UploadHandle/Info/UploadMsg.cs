using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UploadHandle
{
    /// <summary>
    /// 上传文件，客户端的消息说明
    /// </summary>
    public class UploadMsg
    {
        public string OldName { get; set; }
        public string NewName { get; set; }
        public int Size { get; set; }
        /// <summary>
        /// 后台处理模式
        /// </summary>
        public int HandleType { get; set; }
        /// <summary>
        /// 后台保存的子文件夹
        /// </summary>
        public string SubFolder { get; set; }
        public string Other { get; set; }
    }
}
