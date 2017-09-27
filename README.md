<h3>#Asp.Net Core版</h3>
1.后台Nuget包安装命令：
<pre>
Install-Package UploadHandleCore -Version 1.0.1
</pre>
2.Nuget 包地址：<a hre='https://www.nuget.org/packages/UploadHandleCore' target='_blank'>https://www.nuget.org/packages/UploadHandleCore</a> <br/>
<h3>#Uploader6.2升级处理</h3><br />
1.重点上传图片，后台生成缩略图功能
<pre>
      LogHelper.LogHelper _log = new LogHelper.LogHelper();
        public void ProcessRequest(HttpContext context)
        {
            try
            {
                Receiver _receive = new Receiver("imgsouce/origin");
                //接收文件成功
                _receive.OnSuccess = (data) =>
                {
                    //接收文件成功后，自动生成缩略图
                    // 大图
                    ThumbnailHandle _thumb = new ThumbnailHandle(data, "big", 920);
                    _thumb.AutoHandle();
                    string big = _thumb.GetRelativeName();
                    _log.WriteLine("大图位置：" + big);

                    //小图
                    _thumb.Width = 320;
                    _thumb.Folder = "small";
                    _thumb.AutoHandle();
                    string small = _thumb.GetRelativeName();
                    _log.WriteLine("小图位置：" + small);

                    data.Data = new { big = big, small = small };

                    //此处，有需要的情况下，执行数据库操作
                    _log.WriteLine(string.Format("新文件名{0},旧文件名{1}", data.NewName, data.OldName));
                };
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }
</pre>

2.添加UploadHandleCore ，支持服务点Asp.Net Core
-->ajax使用方式
<pre>
AjaxReceiver _receive = new AjaxReceiver(this.HttpContext);
//接收文件成功
_receive.OnSuccess = (data) =>
{
    Write(string.Format("新文件名{0},旧文件名{1}", data.NewName, data.OldName));
};
_receive.DoWork();</pre>
-->Websocket方式,需要在启动Startup的configure中，注入监听
<pre>
//绑定WebSocket处理，接收成功后，生成缩略图
app.Map("/common/socket_thumb", (con) =>
{
    con.UseWebSockets();//启用webscoket
    con.Use((ctx, n) =>
    {
        Receiver _receive = new Receiver(ctx, "imgdata/origin");
        _receive.OnSuccess += (data) =>
        {
            //接收文件成功后，自动生成缩略图
            // 大图
            ThumbnailHandle _thumb = new ThumbnailHandle(data, "big", 920);
            _thumb.AutoHandle();
            string big = _thumb.GetRelativeName();
            CommonController.Write("大图位置：" + big);

            //小图
            _thumb.Width = 320;
            _thumb.Folder = "small";
            _thumb.AutoHandle();
            string small = _thumb.GetRelativeName();
            CommonController.Write("小图位置：" + small);

            data.Data = new { big = big, small = small };

            //此处，有需要的情况下，执行数据库操作
            CommonController.Write(string.Format("新文件名{0},旧文件名{1}", data.NewName, data.OldName));
        };
        return _receive.DoWork();
    });
});
</pre>



#Uploader6.1 升级处理<br/>
1.重点更新，添加Ajax传输方式处理，对于大多中小文件的上传都支持<br/>
2.重点更新，前台图片压缩处理，添加固定图片大小模式<br/>
3.对于传输模式uploadType，推荐使用webscoket 方式<br/>


#Uploader6.0 上传控件代码重构<br/>
1.不再支持IE9及以下浏览器<br/>
2.前后文件读取使用FileReader<br/>
3.前台图片处理使用Canvas<br/>
4.前后台数据交货使用WebSocket，后台逻辑分装在Asp.Net平台下<br/>
#功能说明：<br/>
1.支持大文件上传<br/>
2.支持多个文件上传<br/>
3.支持前台图片剪切<br/>
4.支持前台图片压缩（大小图模式）<br/>
#实例Demo<br/>
参考地址：<a href='http://www.gongjuji.net/uploader' target='_blank'>http://www.gongjuji.net/uploader</a>
#旧版本<br/>
请参考master分支，<a href='https://github.com/tianma3798/Uploader/tree/master'>进入master<a/>

