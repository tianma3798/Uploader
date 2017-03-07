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
    /// 上传的自动存放模式
    /// 放在upload文件夹中 的 'yyyyMM'下的‘dd’子文件夹中
    /// </summary>
    public class AutoHandle
    {
        /// <summary>
        /// 上传的默认文件夹
        /// </summary>
        public string Folder = "upload";

        /// <summary>
        /// 构造函数
        /// </summary>
        public AutoHandle() { }
        public AutoHandle(string folder)
        {
            if (string.IsNullOrEmpty(folder) == false)
                this.Folder = folder;
        }
        /// <summary>
        /// 根据当前上传时间，获取文件夹绝对路径
        /// </summary>
        /// <returns></returns>
        public string GetAbsolutePath()
        {
            //默认当前网站根目录下的yyyyMM/dd
            string path = Folder + "/" + DateTime.Now.ToString("yyyyMM/dd/"); ;
            //如果是相对路径
            if (path.StartsWith("/"))
                path = "~" + path;
            else if (path.StartsWith("~") == false)
                path = "~/" + path;
            path = HttpContext.Current.Server.MapPath(path);
            if (Directory.Exists(path) == false)
                Directory.CreateDirectory(path);
            return path;
        }
        /// <summary>
        /// 获取相对目录
        /// </summary>
        /// <returns></returns>
        public string GetRelativePath()
        {
            string relative = Folder + "/";
            if (relative.StartsWith("/") == false)
                relative = "/" + relative;
            if (relative.EndsWith("/") == false)
                relative += "/";
            relative += DateTime.Now.ToString("yyyyMM/dd/",System.Globalization.DateTimeFormatInfo.InvariantInfo);
            return relative;
        }
    }
}
