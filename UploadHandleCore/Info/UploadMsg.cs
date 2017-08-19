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


    /// <summary>
    /// 处理类型
    /// </summary>
    public enum HandleType
    {
        自动处理 = 0,//上传到upload文件夹
        简单处理 = 1,//上传到服务端指定的文件夹或者前台指定的文件夹
        复杂处理 = 2,//上传到临时文件夹，接收成功后再移动到指定目录
    }
}
