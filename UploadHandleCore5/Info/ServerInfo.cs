using System;
using System.Collections.Generic;
using System.Text;
using System.IO;
namespace UploadHandle
{
    /// <summary>
    /// 服务器信息定义
    /// </summary>
    public class ServerInfo
    {

        /// <summary>
        /// 当前网站文件夹
        /// </summary>
        public static string SitePath { get; set; }

        public static string GetTemp()
        {
            if (string.IsNullOrEmpty(SitePath))
                throw new Exception("还没有指定网站根目录");
            string path= SitePath + "//TempFile";
            if (Directory.Exists(path) == false)
                Directory.CreateDirectory(path);
            return path;
        }

        /// <summary>
        /// 获取根目录
        /// </summary>
        /// <returns></returns>
        public static string GetRoot()
        {
            if (string.IsNullOrEmpty(SitePath))
                throw new Exception("还没有指定网站根目录");
            return SitePath;
        }


        /// <summary>
        /// 获取子目录
        /// </summary>
        /// <param name="subfolder"></param>
        /// <returns></returns>
        public static string GetSub(string subfolder)
        {
            string path = SitePath;
            if (subfolder.StartsWith("/") == false)
                subfolder = "/" + subfolder;
            path += subfolder;
            if (Directory.Exists(path) == false)
                Directory.CreateDirectory(path);
            return path;
        }
    }
}
