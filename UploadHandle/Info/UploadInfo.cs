using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UploadHandle
{
    /// <summary>
    /// 上传文件信息
    /// 1.服务器端都是重命名的，使用Guid
    /// </summary>
    public class UploadInfo
    {
        /// <summary>
        /// 上传文件的字节大小
        /// </summary>
        public long ContentLength { get; set; }
        /// <summary>
        /// 新文件名
        /// </summary>
        public string NewName { get; set; }
        /// <summary>
        /// 旧文件名
        /// </summary>
        public string OldName { get; set; }
        /// <summary>
        /// 当前上传文件的扩展名
        /// </summary>
        public string Extention
        {
            get
            {
                if (string.IsNullOrEmpty(OldName))
                    return "";
                int index = OldName.LastIndexOf(".");
                if (index < 0)
                    return "";
                string extension = OldName.Substring(index, OldName.Length - index);
                return extension;
            }
        }
        /// <summary>
        /// 临时文件夹下的新文件名
        /// </summary>
        public string NewFullName_Temp
        {
            get { return GetTempFile() + NewName; }
        }
        /// <summary>
        /// 当前保存的基础路径
        /// </summary>
        public string UploadPath { get; set; }
        /// <summary>
        /// 关联信息
        /// </summary>
        public object Data { get; set; }
        /// <summary>
        /// 当前前台提交的文件对象
        /// </summary>
        private UploadMsg _UploadMsg { get; set; }
        /// <summary>
        /// 默认构造函数
        /// </summary>
        public UploadInfo()
        {
        }
        ///// <summary>
        ///// 构造函数
        ///// 需要加载WebConfig中的上传节点
        ///// </summary>
        ///// <param name="OldName">旧文件名</param>
        ///// <param name="ContentLength">文件大小</param>
        //public UploadInfo(string OldName, int ContentLength, bool IsRename)
        //{
        //    this.OldName = OldName;
        //    this.ContentLength = ContentLength;
        //    //如果是第一次创建链接需要创建新名称
        //    if (IsRename)
        //        this.NewName = UploadInfo.CreateNewName(Extention);
        //    else
        //        this.NewName = OldName;
        //    //加载配置文件中上传文件夹
        //    this.UploadPath = GetUploadFiles();
        //}
        /// <summary>
        /// 根据客户端json信息，创建
        /// </summary>
        /// <param name="upMsg"></param>
        public UploadInfo(UploadMsg upMsg, string AbolutePath = null)
        {
            this.OldName = upMsg.OldName;
            this.ContentLength = upMsg.Size;
            if (string.IsNullOrEmpty(upMsg.NewName))
                this.NewName = UploadInfo.CreateNewName(Extention);
            else
                this.NewName = upMsg.NewName;
            _UploadMsg = upMsg;
            if (upMsg.HandleType == HandleType.自动处理.GetHashCode())
            {
                //自动模式，上传到网站upload文件夹
                this.UploadPath = new AutoHandle(upMsg.SubFolder).GetAbsolutePath();
            }
            else if (upMsg.HandleType == HandleType.简单处理.GetHashCode())
            {
                //简单处理模式，直接保存到指定uploadpath中
                if (string.IsNullOrEmpty(AbolutePath))
                {
                    //获取配置文件中的目录
                    string configPath = GetUploadFiles();
                    if (string.IsNullOrEmpty(upMsg.SubFolder) == false)
                    {
                        configPath += upMsg.SubFolder;
                    }
                    if (Directory.Exists(configPath) == false)
                        Directory.CreateDirectory(configPath);
                    this.UploadPath = configPath;
                }
                else
                {
                    this.UploadPath = AbolutePath;
                }
            }
            else  //如果是带临时处理的，保存到临时文件夹
            {
                //加载配置文件中上传文件夹
                this.UploadPath = GetTempFile();
            }
        }
        /// <summary>
        /// 构造函数，指定存储文件夹
        /// </summary>
        /// <param name="OldName">旧文件名</param>
        /// <param name="ContentLength">文件大小</param>
        /// <param name="UploadPath">上传文件夹</param>
        public UploadInfo(string OldName, int ContentLength, string UploadPath)
        {
            this.OldName = OldName;
            this.ContentLength = ContentLength;
            this.NewName = UploadInfo.CreateNewName(Extention);
            this.UploadPath = UploadPath;
        }
        /// <summary>
        /// 获取当前要保存的文件的文件目录
        /// </summary>
        /// <param name="subFolder">子文件夹</param>
        /// <returns></returns>
        public string GetUploadFiles(string subFolder = null)
        {
            if (string.IsNullOrEmpty(subFolder))
                return UploadPath;
            DirectoryInfo info = new DirectoryInfo(UploadPath);
            if (!info.Exists)
                info.Create();
            return info.CreateSubdirectory(subFolder).FullName;
        }
        /// <summary>
        /// 获取当前上传文件的服务器相对路径
        /// </summary>
        /// <returns></returns>
        public string GetRelativeName()
        {
            if (_UploadMsg.HandleType == 0)
            {
                return new AutoHandle(_UploadMsg.SubFolder).GetRelativePath() + this.NewName;
            }
            else if (_UploadMsg.HandleType == 1)
            {
                string newName = this.NewName;
                if (string.IsNullOrEmpty(_UploadMsg.SubFolder))
                    return newName;
                if (_UploadMsg.SubFolder.StartsWith("/"))
                    return _UploadMsg.SubFolder.Substring(1) + "/" + newName;
                return _UploadMsg.SubFolder + "/" + newName;
            }
            else
            {
                //临时文件夹上传模式
                return "/content/tempfile/" + this.NewName;
            }
        }
        /// <summary>
        /// 获取当前上传文件的绝对路径
        /// </summary>
        /// <returns></returns>
        public string GetFullName()
        {
            return this.UploadPath + this.NewName;
        }
        /// <summary>
        /// 获取上传的子文件夹
        /// </summary>
        /// <returns></returns>
        public string GetSubFolder()
        {
            return _UploadMsg.SubFolder;
        }
        /// <summary>
        /// 产生一个新的文件名
        /// </summary>
        /// <param name="extention">扩展名</param>
        /// <returns></returns>
        public static string CreateNewName(string extention)
        {
            string name = Guid.NewGuid().ToString() + extention;
            return name;
        }

        #region 上传文件夹获取
        /// <summary>
        /// 获取临时上传文件夹
        /// 对应WebConfig中的TempFile
        /// </summary>
        /// <returns></returns>
        public static string GetTempFile()
        {
            string tempfile = Common.ConfigValue.TempFile;
            if (!Directory.Exists(tempfile))
                Directory.CreateDirectory(tempfile);
            return tempfile;
        }
        /// <summary>
        /// 获取后台站点，上传用户的保存‘基础路径’
        /// 如果需要前台用户保存的'基础路径'，则放在构造函数中指定
        /// 对应WebConfig中的'B_UploadPath'
        /// </summary>
        /// <returns></returns>
        public static string GetUploadFiles()
        {
            string path = Common.ConfigValue.UploadPath;
            if (Directory.Exists(path) == false)
                Directory.CreateDirectory(path);
            return path;
        }
        /// <summary>
        /// 判断指定文件是否在临时文件夹中存在
        /// </summary>
        /// <param name="filename">文件名</param>
        /// <returns></returns>
        public static bool ExistsFromTemp(string filename)
        {
            FileInfo info = new FileInfo(GetTempFile() + filename);
            if (info == null)
                return false;
            return info.Exists;
        }
        #endregion
    }
}
