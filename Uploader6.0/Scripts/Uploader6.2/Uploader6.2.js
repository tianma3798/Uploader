/**
* Uploader控件重构6.1
* 1.本插件依赖jQuery
* 2.如果使用前台图片剪切，还依赖于Cover3.0覆盖层
* 3.当前插件是jquery插件，但是实例化后不再支持链式编程
* 4.不再支持IE9及以下浏览器
* 5.使用_this.sending解决IE浏览器单个文件发送成两个的问题
*
* 6.新增Ajax上传处理方式
*/
/**
* 功能及参数描述
*/
(function ($) {
    //站点下公共参数和配置对象，可以在源代码中预配置默认参数
    var uploadCfg = {
        url: '',//默认的上传地址
        isImg: true,//是否默认为图片上传
        targetExt: '.png',//上传图片数据是后台保存的格式
        tempFile: '/content/tempfile/',//设置临时文件夹，如果是临时上传模式
        //统一错误处理
        error: function (str) {
            alert(str);
        }
    }
    var UPLOADTYPE = {
        single: 'single',
        dialog: 'dialog',
        imgdouble: 'imgdouble',
        fixedone: 'fixedone'
    }
    window.UPLOADTYPE = UPLOADTYPE;

    //控件上传封装类
    var uploader = function (elem, opts) {
        var _this = this;
        var defaults = {
            url: uploadCfg.url,//上传地址
            text: '选择文件', //上传按钮文本
            type: 'single',//控件类型  
            /*
            * 1.简单形式(single,单纯上传文件，自动提交)
            * 2.对话框形式(dialog，需要图片剪切处理)
            * 3.前台压缩，大小图片上传 (imgdouble) ：不改变原图片的比例，在指定范围内等比例缩放，不修改图片内容 
            * 4.前台最大比例，图片处理（fixedsize）：固定比例缩放，最大化图片显示，剩余空间填充空白
            */
            handleType: '0',//后台处理模式 0-自动模式，上传到网站upload文件夹中    1--简单模式，上传到WebConfig指定文件夹中   2---临时处理模式上传到临时文件夹
            uploadType: 1,//上传处理方式 1-----Ajax上传处理（默认）  2----WebSocket上传处理（主要用于应对单文件上传）
            subfolder: '',//指定后台保存的子文件夹
            more: false, //是否支持多个文件
            debug: true, //如果是调试模式，指定输出内容

            maxWidth: 1960,//前台压缩时，最大宽度
            maxHeight: 1000,//前台压缩时，最大高度
            minWidth: 300,//前台压缩时，最小宽度
            minHeight: 300,//前台压缩时，最小高度
            background: 'white',// 在使用到背景处理时的，默认背景
            tempFile: uploadCfg.tempFile,//设置临时文件夹
            auto: true,//是否自动上传文件
            isImg: true,//是否是图片，如果是图片提供预览功能
            fileExts: 'jpg;png;gif;bmp;jpeg',//允许上传的文件扩展名，*----没有显示
            timeout: 30000,
            onCheck: function (file) { return true; },//开始上传验证扩展
            onSendImg: function (dataUrl, handle) { handle(); }, //图片发送服务器前验证,需要制定isImg=true
            onSuccess: function () { },//上传成功,如果是‘imgdouble’模式返回图片文件 {imgBig:'',imgSmall:''}
            onAllSuccess: function (data) { },//当全部上传成功时触发
            onError: function (msg) {
                uploadCfg.error(msg);
            },//上传异常处理
            onClick: function () { },//按钮 点击事件
            maxSize: 1024 * 1024 * 1024,//文件最大大小，单位字节
            getMaxSize: function () {// 用于计算显示最大值
                return getShowSize(this.maxSize);
            },
            /**图片剪切参数配置**/
            coverParams: {
                showRight:false
            }
        }
        this.elem = elem;
        this.opts = $.extend({}, defaults, opts);
        //根据当前链接处理uploadType  如果以 ws://开头则是使用webscoket方式
        if (this.opts.url.indexOf('ws://') != -1)
            this.opts.uploadType = 2;
    }
    uploader.prototype = {
        //初始化
        init: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            if (_opts.type == 'dialog') {
                //对话框模式
                _this.initDialog();
            } else {
                //按钮模式
                _this.initBtn();
            }
        },
        //初始化按钮
        initBtn: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            //创建按钮内部
            var text = getDivByClass('uploader_text');
            text.text(_opts.text);
            _elem.append(text);
            //追加 文件域
            var file = getDivByClass('uploader_file');
            var fileBox = $('<input  type="file" name="file"  tabindex="10000"/>');
            if (_opts.more)
                fileBox.prop('multiple', 'multiple');
            file.append(fileBox);
            file.append('<input type="hidden" name="target" class="target" />');
            _elem.append(file);
            //追加 ，进度显示面板
            //判断是否已经追加过
            if (_elem.next().hasClass('uploader_panel') == false)
                _elem.after(getDivByClass("uploader_panel"));

            //绑定事件
            if (_opts.type == UPLOADTYPE.imgdouble || _opts.type == UPLOADTYPE.fixedone) {
                _this.initImgDouble();
            } else {
                _this.bindBtn();
            }
        },
        //绑定按钮上传事件
        bindBtn: function () {
            var _this = this;
            var _elem = this.elem;
            var _opts = this.opts;
            var fileBox = _elem.find('input[type=file]')[0];
            fileBox.onchange = function () {
                if (this.files.length <= 0) {
                    _opts.onError('没有获取到上传文件');
                    return;
                }
                var fileList = this.files;
                //判断是否支持多个文件
                if (_opts.more) {
                    var readers = [];
                    for (var i = 0; i < fileList.length; i++) {
                        var file = fileList[i];
                        //创建读取对象
                        var reader = new MyReader(file, _this, false);
                        readers.push(reader);
                    }
                    var i = 0;
                    var j = 0;//已经打开过的
                    startFile();
                    var thisInter = setInterval(function () {
                        if (j - i > 2)
                            return;
                        startFile();
                    }, 1000);
                    function startFile() {
                        var reader = readers[i];
                        //创建读取对象
                        reader.start();
                        reader.onSendSuccess = function () {
                            j++;
                        }
                        i++;
                        if (i >= fileList.length) {
                            clearInterval(thisInter);
                            if (_opts.onAllSuccess) _opts.onAllSuccess();
                        }
                    }
                } else {
                    //单个文件上传
                    var file = this.files[0];
                    var reader = new MyReader(file, _this, _this.opts.auto);
                }
            }
        },
        //初始化对话框
        initDialog: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            _elem.text(_opts.text);

            //绑定傻妞妞事件
            _elem.click(function () {
                _this.cover = new coverUploader(_this);
            });
        },
        //初始化大小图处理
        initImgDouble: function () {
            var _this = this;
            var _elem = this.elem;
            var _opts = this.opts;
            //创建canvas
            _elem.append('<canvas id="canvasImg" style="display:none;"/>');
            //绑定上传事件
            var file = _elem.find('input[type=file]');
            file.change(function () {
                var fileList = this.files;
                if (fileList.length <= 0)
                    return;

                if (_opts.more) {
                    //控制上传队列，一个一个的上传
                    var loaded = -1;
                    var i = 0;
                    var thisInter = setInterval(function () {
                        if (i > loaded) {
                            var file = fileList[i];
                            //文件类型验证
                            if (checkExt(file, _opts)) {
                                //读取图片并处理
                                _this.bindImgDouble(file, function () {
                                    i++;
                                });
                            }
                        }
                        if (i == fileList.length - 1) {
                            clearInterval(thisInter);
                            if (_opts.onAllSuccess)_opts.onAllSuccess();
                        }
                        loaded = i;
                    }, 200);
                } else {
                    var file = fileList[0];
                    //文件类型验证
                    if (checkExt(file, _opts) == false)
                        return false;
                    //读取图片并处理
                    _this.bindImgDouble(file);
                }
            });
        },
        //指定单个文件域压缩处理+上传图片 
        bindImgDouble: function (file, onSuccess) {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            //读取文件
            var reader = new FileReader();
            reader.onload = function () {
                var result = reader.result;
                new ImageFilter(_this, result, function (data) {
                    if (_opts.onSuccess) _opts.onSuccess(data);
                    if (onSuccess) onSuccess(data);
                });
            }
            reader.readAsDataURL(file);
        }
    }


    /******************************Image 上传过滤处理*****************************/
    function ImageFilter(uploader, dataUrl, onSuccess) {
        this.uploader = uploader;
        this.onSuccess = onSuccess;
        this.opts = uploader.opts;
        this.canvas = document.getElementById('canvasImg');
        this.ctx = this.canvas.getContext('2d');
        //创建图片对象
        var _this = this;
        var img = new Image();
        img.onload = function () {
            _this.onload();
        }
        img.src = dataUrl;
        this.img = img;
    }
    ImageFilter.prototype = {
        //创建图片成功
        onload: function () {
            var _this = this;
            var _opts = this.opts;
            //根据类型处理
            if (_opts.type == UPLOADTYPE.imgdouble) {
                _this.doubleHandle();
            } else if (_opts.type == UPLOADTYPE.fixedone) {
                _this.fixedHandle();
            }
        },
        //图片固定大小处理
        fixedHandle: function () {
            var _this = this;
            var _opts = this.opts;
            var canvas = this.canvas;
            var ctx = this.ctx;
            var img = this.img;
            //处理逻辑,确定canvas的大小maxWidth/maxHeight，按比例，居中图片处理,背景默认使用白色
            canvas.width = _opts.maxWidth;
            canvas.height = _opts.maxHeight;
            ctx.fillStyle = _opts.background;
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.fill();

            //图片最大化缩放
            var iWidth = img.width;
            var iHeight = img.height;
            if (iWidth > _opts.maxWidth) {
                iHeight = iHeight * (_opts.maxWidth / iWidth);
                iWidth = _opts.maxWidth;
            }
            if (iHeight > _opts.maxHeight) {
                iWidth = iWidth * (_opts.maxHeight / iHeight);
                iHeight = _opts.maxHeight;
            }
            img.width = iWidth;
            img.height = iHeight;
            var left = (canvas.width - iWidth) / 2;
            var top = (canvas.height - iHeight) / 2;
            ctx.drawImage(img, left, top, iWidth, iHeight);
            var dataUrl = canvas.toDataURL('image/jpeg');

            //发送服务器
            _opts.targetExt = '.jpg';
            _this.sendData(dataUrl, function (data) {
                if (_this.onSuccess) _this.onSuccess(data);
            });
        },
        //大，小图
        doubleHandle: function () {
            var _this = this;
            var img = this.img;
            var canvas = this.canvas;
            var ctx = this.ctx;
            var _opts = this.opts;
            //图片处理,先处理和上传大图，在处理小图
            var iWidth = img.width;
            var iHeight = img.height;
            //最大宽度高度处理
            if (iWidth > _opts.maxWidth) {
                iHeight = iHeight * (_opts.maxWidth / iWidth);
                iWidth = _opts.maxWidth;
            }
            if (iHeight > _opts.maxHeight) {
                iWidth = iWidth * (_opts.maxHeight / iHeight);
                iHeight = _opts.maxHeight;
            }
            //*****上传大图片
            var dataUrl = _this.getDataURL(iWidth, iHeight);
            _opts.targetExt = '.jpg';
            if (_opts.handleType != 0) {
                _opts.subfolder2 = '/big';
            }
            //大小图 分开上传
            _this.sendData(dataUrl, function (data) {
                var doubleResult = {};
                doubleResult.big = data;
                //小图处理
                if (iWidth > _opts.minWidth) {
                    iHeight = iHeight * (_opts.minWidth / iWidth);
                    iWidth = _opts.minWidth;
                }
                if (iHeight > _opts.minHeight) {
                    iWidth = iWidth * (_opts.minHeight / iHeight);
                    iHeight = _opts.minHeight;
                }
                //提交图片
                dataUrl = _this.getDataURL(iWidth, iHeight);
                if (_opts.handleType != 0) {
                    _opts.subfolder2 = '/small';
                }
                //发送小图片
                _this.sendData(dataUrl, function (data) {
                    //小图上传成功
                    doubleResult.small = data;
                    //触发上传成功事件
                    if (_this.onSuccess) _this.onSuccess(doubleResult);
                });
            });
        },
        //重绘图片到canvas
        getDataURL: function (iWidth, iHeight) {
            var img = this.img;
            var canvas = this.canvas;

            img.width = canvas.width = iWidth;
            img.height = canvas.height = iHeight;

            this.ctx.clearRect(0, 0, iWidth, iHeight);
            this.ctx.drawImage(img, 0, 0, iWidth, iHeight);
            var dataUrl = canvas.toDataURL('image/jpeg');
            return dataUrl;
        },
        //发送图片文件统一处理
        sendData: function (dataUrl, onSuccess) {
            var _this = this;
            //发送服务器前验证
            var flag = _this.opts.onSendImg(dataUrl, function () {
                //上传 处理
                var upload = new UploadData(_this, {
                    data: dataUrl
                });
                upload.onSuccess = function (data) {
                    if (onSuccess) onSuccess(data);
                }
            });
        }
    }


    /******************************上传读取对象,指定单个文件,分段上传*****************************/
    function MyReader(file, loader, enableRead) {
        var _this = this;
        this.uploader = loader;
        this.opts = loader.opts;
        this.uploadType = loader.opts.uploadType;
        this.file = file;
        this.step = 1024 * 256;//每次读取文件的大小
        this.loaded = 0;//当前已经上传成功的大小
        this.readed = 0;//当前已经读取的文件大小
        this.enableRead = enableRead || false;//标记是否可读取
        this.startTime = new Date();
        this.total = file.size;
        this.debug = loader.opts.debug;
        this.sending = false;//判断是否正在发送文件
        //文件验证
        if (this.check()) {
            //如果是图片，先验证 再提交
            if (this.opts.isImg) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    _this.opts.onSendImg(reader.result, function () {
                        //初始化处理
                        _this.init();
                    });
                }
                reader.readAsDataURL(file);
            } else {
                //初始化处理
                _this.init();
            }
        }
    }
    MyReader.prototype = {
        //文件验证
        check: function () {
            var _this = this;
            var _opts = this.uploader.opts;
            //文件大小
            if (this.total > _opts.maxSize) {
                _opts.onError('文件大小不能超过：' + _opts.getMaxSize());
                return false;
            }
            //文件类型
            return checkExt(_this.file, _opts);
        },
        //初始化页面显示
        init: function () {
            var _this = this;
            //如果是Ajax提交则读取间隔加大
            if (this.uploadType == 1) this.step = 1024 * 1024;
            if (_this.enableRead) {
                _this.start();
            }

            //创建当前显示的面板
            var panel = this.uploader.elem.next();
            var item = getDivByClass('uploader_item');
            this.elem = item;
            item.append('<div class="title"><span class="file-icon"></span> <span class="file-name">' + this.file.name + '</span></div>');
            item.append('<div class="uploader-progress"><progress></progress></div>');
            //底部状态栏
            var status = getDivByClass('status');
            status.append('<div class="left"><span class="btn-proc">暂停</span></div>');
            var right = getDivByClass('right');
            right.append('<span id="loaded">0</span>/<span class="total">' + getShowSize(this.total) + '</span>');
            right.append('&emsp;');
            right.append('<span class="time-proc">0</span>');
            status.append(right);

            status.append('<div class="clear"></div>');
            item.append(status);
            item.append('<span class="close">&times;</span>');
            panel.append(item);
            //显示状态
            _this.showStatus();
            //开始/暂停
            item.find('.btn-proc').click(function () {
                var thisBtn = $(this);
                if (thisBtn.text() == '暂停') {
                    thisBtn.text('开始');
                    _this.stop();
                } else {
                    thisBtn.text('暂停');
                    _this.containue();
                }
            });
            //关闭按钮
            item.find('.close').click(function () {
                if (window.confirm('关闭将会放弃上传！')) {
                    //关闭连接放弃上传
                    _this.close();
                    item.slideUp('normal', function () {
                        item.remove();
                    });
                }
            });
        },
        //开始读取和上传
        start: function () {
            var _this = this;
            _this.enableRead = true;
            if (_this.uploadType == 1) {
                _this.startAjax();
            } else {
                _this.startScoket();
            }
        },
        /**
       * 使用Ajax方式 处理数据传输
       */
        startAjax: function () {
            var _this = this;
            //开始读取
            var reader = this.reader = new FileReader();
            //读取成功执行发送
            reader.onload = function (e) {
                _this.readed += e.loaded;
                var blob = new Blob([reader.result]);
                //第一次发送先发送文件信息
                if (_this.sending == false) {
                    //创建ajax链接发送文件信息
                    sendData(null, null, function (data) {
                        sendData(blob, data);
                    });
                    _this.sending = true;
                } else {
                    //创建 ajax链接发送数据
                    sendData(blob, _this.result);
                }
            }
            _this.readBlob();
            //执行发送操作
            function sendData(blob, backInfo, onSuccess) {
                var ajax = new MyAjax(_this.uploader);
                if (backInfo)
                    ajax.send(blob, _this.result);
                else
                    ajax.sendInfo(_this.getFileInfo());
                ajax.onmessage = function (data) {
                    _this.result = data;
                    if (onSuccess)
                        onSuccess(data);
                    else {
                        //进度条显示处理
                        _this.loaded += data.curLength;
                        _this.showStatus();
                        if (_this.readed >= _this.total) {
                            //读取结束
                            _this.sendSuccess();
                        } else {
                            //继续读取文件
                            _this.readBlob();
                        }
                    }
                }
            }
        },
        /**
        * 使用WebScoket方式 处理数据传输
        */
        startScoket: function () {
            var _this = this;
            var reader = this.reader = new FileReader();
            //创建链接对象，一个读取实例、一个链接
            var socket = new MySocket(_this.uploader, this);
            this.socket = socket;
            //打开成功
            socket.onopen = function () {
                //段读取成功
                reader.onload = function (e) {
                    //继续发送
                    _this.readed += e.loaded;
                    _this.readedScocket();
                }
                //开始读取
                _this.readBlob();
            }
            //接收文件成功
            socket.onmessage = function (data) {
                var result = JSON.parse(data);
                _this.result = result;
                if (result.newName.length > 0 && result.status == 1) {
                    _this.newName = result.newName || "";
                    _this.loaded += result.curLength || 0;
                    //显示状态
                    _this.showStatus();
                    //判断是否上传成功
                    if (_this.loaded >= _this.total) {
                        _this.sendSuccess();
                        if (_this.debug)
                            console.log('总上传：' + _this.loaded + ',用时：' + (new Date().getTime() - _this.startTime.getTime()) / 1000);
                    }
                } else {
                    console.error("上传出错：");
                    console.error(result);
                }
            }
        },
        //绑定WebScoket方式的读取
        readedScocket: function () {
            //读取成功处理
            var _this = this;
            var reader = this.reader;
            var _socket = this.socket;
            //如果没有完成，继续读取
            sendData();
            if (_this.readed < _this.total) {
                //根据当前缓冲区控制客户端读取速度
                if (_socket.ws.bufferedAmount > 1204 * 1024 * 2) {
                    var thisTimer = setInterval(function () {
                        if (_socket.ws.bufferedAmount <= 1204 * 1024) {
                            clearInterval(thisTimer);
                            //继续发送
                            _this.readBlob();
                        }
                    }, 10);
                } else {
                    //继续发送
                    _this.readBlob();
                }
            } else {
                if (_this.debug)
                    console.log('总读取：' + _this.readed + ',用时：' + (new Date().getTime() - _this.startTime.getTime()) / 1000);
            }
            //执行发送操作
            function sendData() {
                //将分段数据上传到服务器
                var blob = reader.result;
                if (_this.sending == false) {
                    //第一次发送文件信息
                    _socket.send(JSON.stringify(_this.getFileInfo()));
                    _this.sending = true;
                }
                _socket.send(blob);
            }
        },
        //上传成功
        onSendSuccess: function () { },
        sendSuccess: function () {
            var _this = this;
            //删除面板
            _this.elem.find('.btn-proc').off('click').html('<span style="color:red;">上传成功</span>');
            setTimeout(function () {
                _this.elem.slideUp('fast', function () {
                    _this.elem.remove();
                }).fadeOut('fast');
            }, 1500);
            //关闭链接
            _this.close();
            //触发事件
            var _opts = _this.uploader.opts;
            if (_opts.onSuccess) {
                _opts.onSuccess(_this.result);
            }
            _this.onSendSuccess();
        },
        //显示当前上传状态
        showStatus: function () {
            var _this = this;
            var item = _this.elem;
            if (_this.enableRead == false)
                return;
            //进度条
            var progress = item.find('progress')[0];
            progress.value = _this.loaded;
            progress.max = _this.total;
            //下载数据
            var load = item.find('#loaded');
            load.text(getShowSize(_this.loaded));
            //显示已经读取的时间
            var time = item.find('.time-proc');
            var timeStr = (new Date().getTime() - _this.startTime.getTime()) / 1000;
            time.text(getShowTime(timeStr));
        },
        //指定位置读取
        readBlob: function () {
            var _this = this;
            if (_this.enableRead == false)
                return;
            var blob = this.file.slice(this.readed, this.readed + this.step);
            this.reader.readAsArrayBuffer(blob);
        },
        //中止
        stop: function () {
            var _this = this;
            if (_this.debug)
                console.info('中止，loaded:' + _this.loaded);
            _this.enableRead = false;
            _this.reader.abort();
        },
        //继续
        containue: function () {
            var _this = this;
            if (_this.debug)
                console.info('继续,loaded:' + _this.loaded);
            _this.enableRead = true;
            _this.readBlob();
        },
        //关闭读取和上传
        close: function () {
            var _this = this;
            //关闭读取
            _this.stop();
            //关闭上传链接
            if (_this.uploadType == 2)
                _this.socket.close();
        },
        //获取文件信息 
        getFileInfo: function () {
            var _this = this;
            var _opts = this.uploader.opts;
            var fileInfo = {
                oldName: _this.file.name, //上传的文件名称
                newName: _this.newName,//后台生成的文件名称
                size: _this.total,//上传文件的大小
                subfolder: _opts.subfolder,
                handleType: _opts.handleType,//当前上传的后台处理模式  1. single 简单处理模式 2.temporary 带临时处理
                other: '',//上传的其他参数或说明,保留
            };
            return fileInfo;
        }
    };

    /******************************指定文件数据DataURL ，单个文件一次性上传*****************************/
    function UploadData(uploader, options) {
        this.loader = uploader;
        //默认值定义
        var defaults = {
            data: [],//上传的文件数据
            isImg: uploader.opts.isImg,//上传类型处理，1----普通文件上传 2---图片文件上传
            uploadType: uploader.opts.uploadType,//指定上传类型
            /*
            * imgType:图片类型 'image/jpg','image/png','image/gif'
            */
            imgType: 'image/jpeg', //图片上传，指定图片类型
            size: 0,//上传的文件 大小
        }
        this.opts = $.extend({}, defaults, options);
        this.init();
    }
    UploadData.prototype = {
        //自动处理上传
        init: function () {
            var _this = this;
            var _opts = this.opts;
            //判断是否是图片上传
            if (_opts.isImg) {
                //判断上传类型处理
                if (_opts.uploadType == 1) {
                    //使用ajax方式上传
                    _this.ajaxImg();
                } else {
                    //使用scoket 方式上传
                    _this.socketImg();
                }
            } else {
                console.error("当前类型不是图片");
            }
        },
        //使用Ajax方式上传图片
        ajaxImg: function () {
            var _this = this;
            var _loader = this.loader;

            //获取可发送的图片数据
            var blob = _this.getBlob();
            //创建ajax链接发送文件信息
            var infoAjax = new MyAjax(_loader);
            infoAjax.sendInfo(_this.getFileInfo());
            infoAjax.onmessage = function (backInfo) {
                //创建 ajax链接发送数据
                var ajax = new MyAjax(_loader);
                ajax.send(blob, backInfo);
                ajax.onmessage = function (data) {
                    if (data.curSize >= data.size) {
                        //发送成功
                        _this.onSuccess(data);
                    }
                }
            }
        },
        /*
        * socket方式 上传图片处理
        * 指定DataUrl 上传图片文件一次性 上传
        */
        socketImg: function () {
            var _this = this;
            //获取可发送的图片数据
            var blob = _this.getBlob();
            //创建链接，提交图片
            var socket = new MySocket(this.loader, undefined, undefined);
            socket.onopen = function () {
                //先发送文件信息
                socket.send(JSON.stringify(_this.getFileInfo()));
                //发送数据
                socket.send(blob);
            }
            var loaded = 0;
            socket.onmessage = function (data) {
                var result = JSON.parse(data);
                loaded += result.curLength || 0;
                if (loaded >= blob.size) {
                    //上传成功后自动关闭
                    socket.close();
                    _this.onSuccess(result);
                }
            }
        },
        //解析图片数据，为blob
        getBlob: function () {
            var _opts = this.opts;
            var dataUrl = _opts.data;
            var data = dataUrl.split(',')[1];
            data = window.atob(data);
            var array = new Uint8Array(data.length)
            for (var i = 0; i < data.length; i++) {
                array[i] = data.charCodeAt(i);
            }
            var blob = new Blob([array], { type: _opts.imgType });

            if (_opts.size == 0)
                _opts.size = blob.size;//获取文件大小,单个文件时候的大小确定
            return blob;
        },
        //获取上传发送的文件基本信息
        getFileInfo: function () {
            var _this = this;
            var _opts = this.loader.opts;

            //发送文件信息
            var fileInfo = {
                oldName: '前台处理图片' + _opts.targetExt, //上传的文件名称
                size: _this.opts.size,//上传文件的大小
                subfolder: _opts.subfolder + (_opts.subfolder2 || ''),
                handleType: _opts.handleType,//当前上传的后台处理模式  1. single 简单处理模式 2.temporary 带临时处理
                other: '',//上传的其他参数或说明,保留
            };
            return fileInfo;
        },
        onSuccess: function (result) { },//上传成功触发,传入，服务器相应数据
        onError: function () { console.error('上传异常空处理'); },//上传失败触发
    }



    /**************Ajax 传输操作对象************/
    function MyAjax(upload, onSuccess) {
        this.uploader = upload;
        var _opts = this.uploader.opts;
        this.onSuccess = onSuccess;
        this.debug = _opts.debug;

        //连接验证
        var url = _opts.url;
        if (url == undefined || url.length <= 0) {
            alert('ajax提交连接地址不能空');
            return;
        }
        this.url = url;
        this.xhr = new XMLHttpRequest();
        //初始化绑定
        this.bind();
    }
    MyAjax.prototype = {
        //初始化绑定
        bind: function () {
            var _this = this;
            var xhr = this.xhr;
            //打开链接
            xhr.open('post', _this.url, true);
            //监听发送数据
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    //接收成功
                    var text = xhr.responseText;
                    var data = JSON.parse(text);
                    this.backData = data;
                    //判断是否接收成功
                    _this.onmessage(data);
                }
                else if (xhr.status == 500) {
                    _this.onerror('服务器处理出错 ，' + xhr.responseText, xhr);
                }
            }
        },
        //当连接打开成功
        onopen: function () { },
        //服务端相应数据
        onmessage: function (data) { },
        //关闭链接,终止发送
        onclose: function () {
            this.xhr.abort();
        },
        //请求出错 时触发
        onerror: function (msg, xhr) {
            console.info(xhr);
            console.error(msg);
        },
        //发送文件信息
        sendInfo: function (fileInfo) {
            var str = JSON.stringify(fileInfo);
            var fd = new FormData();
            fd.append('fileinfo', str);
            try {
                this.xhr.send(fd);
            } catch (e) {
                console.error(e);
            }
        },
        //发送 数据处理 
        send: function (data, backInfo) {
            var _this = this;
            try {
                var fd = new FormData();
                fd.append('file', data);
                fd.append('backinfo', JSON.stringify(backInfo));
                this.xhr.send(fd);
            } catch (e) {
                console.error(e);
            }
        }
    };
    /**************WebSocket 传输操作对象************/
    function MySocket(upload, reader, onSuccess) {
        var _this = this;
        this.uploader = upload;
        this.reader = reader;
        var _opts = this.uploader.opts;
        this.onSuccess = onSuccess;
        this.debug = _opts.debug;
        //链接验证，创建实例
        var url = _opts.url;
        if (url == undefined || url.length <= 0) {
            alert('socket链接地址不能为空');
            return;
        }
        try {
            this.url = url;
            this.ws = new WebSocket(url);
        } catch (e) {
            if (_this.debug)
                console.error(e);
            console.error('创建socket链接失败，当前地址：' + url);
        }
        //初始化绑定
        _this.bind();
    }
    MySocket.prototype = {
        //初始化绑定事件
        bind: function () {
            var _this = this;
            var reader = _this.reader;
            var ws = _this.ws;
            ws.onopen = function () {
                if (_this.debug)
                    console.log('connected成功');
                _this.onopen();
                if (_this.onSuccess)
                    _this.onSuccess();
            }
            ws.onmessage = function (e) {
                var data = e.data;
                _this.onmessage(data);
            }
            ws.onclose = function (e) {
                //中止客户端读取
                if (reader)
                    reader.stop();
                if (_this.debug)
                    console.log('链接中断');
            }
            ws.onerror = function (e) {
                //链接出错
                if (reader)
                    reader.stop();
                if (_this.debug) {
                    console.log('链接发生异常');
                }
                console.error(e);
            }
        },
        //当链接打开成功
        onopen: function () { },
        //每次读取成功
        onmessage: function (data) { },
        //关闭读取
        close: function () {
            var _this = this;
            var ws = _this.ws;
            ws.close();
        },
        //发送数据
        send: function (data) {
            var _this = this;
            var ws = _this.ws;
            if (ws.readyState == WebSocket.OPEN) {
                ws.send(data);
            } else {
                if (_this.debug) {
                    console.info("当前链接还不是打开状态:" + ws.readyState);
                    console.error(ws);
                }
            }
        }
    }


    /******************************对话框处理*****************************/
    //操作处理，变量定义
    function coverUploader(loader) {
        var _this = this;
        _this.uploader = loader;
        var defaults = {
            title: '上传图片',//对话框标题
            itemWidth: 450,
            itemHeight: 450,
            targetWidth: 200, //剪切后图片的宽度
            targetHeight: 100, //剪切后图片的高度
            onYes: function () {
            },
            onCancel: function () { },//取消按钮事件
            onClose: function () {
                return true;//返回值，确定是否能销毁对话框
            } //关闭事件
        }
        this.opts = $.extend({}, defaults, _this.uploader.opts.coverParams);
        var _opts = this.opts;

        /**全局操作变量**/
        _this.initWidth = 0;
        _this.initHeight = 0;
        _this.scale = 1;
        _this.spanBackLeft = 0;
        _this.spanBackTop = 0;

        //创建对话框
        var elem = $(getDivByClass('contentElem'));
        //计算对话框宽度、高度
        _opts.width = _opts.itemWidth + 20;
        if (_opts.showRight) {
            _opts.width += (_opts.targetWidth + 30 + 20);
        }
        _opts.height = _opts.itemHeight + 30 + 35 + 20;
        var cover = $.cover({
            width: _opts.width,
            height: _opts.height,
            borderRadius: 0,
            clickDestroy: false,
            html: elem
        });
        this.elem = elem;
        this.cover = cover;
        //初始化
        this.init();
    }
    coverUploader.prototype = {
        //初始化
        init: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            //头部
            _this.initTop();
            //内容
            var middle = getDivByClass('uploader_middle');
            _elem.append(middle);
            _this.initLeftItem();
            _this.initRightItem();
            if (_opts.showRight == false) {
                _elem.find('.rightItem').hide();
            }
            middle.append(getDivByClass('clear'));
            //底部按钮
            _this.initBottom();
            //初始化绑定事件
            _this.bind();
        },
        //初始化绑定事件
        bind: function () {
            var _this = this;
            var _elem = this.elem;
            var _opts = this.opts;

            var canvasSource = document.getElementById('canvasSource');
            var ctx = canvasSource.getContext('2d');
            var imgItem = _elem.find('.imgItem');
            var canvasUp = imgItem.find('#canvasUp');
            var canvasBack = imgItem.find('.canvasBack')
            //绑定  canvasUp 拖动事件
            var isMove = false;
            var spanLeft = 0,
                spanTop = 0;
            canvasUp.mousedown(function (e) {
                isMove = true;
                spanLeft = e.pageX - canvasUp.offset().left;
                spanTop = e.pageY - canvasUp.offset().top;
                return false;
            });
            canvasBack.mouseup(function (e) {
                isMove = false;
                isBackMove = false;
            }).mousemove(function (e) {
                //canvasUp获取移动后的位置
                if (isMove) {
                    var tempLeft = e.pageX - imgItem.offset().left - spanLeft;
                    var tempTop = e.pageY - imgItem.offset().top - spanTop;
                    _this.setCanvasUpSite(tempLeft, tempTop);
                }
                //背景移动位置
                if (isBackMove) {
                    var currentX = e.clientX;
                    var currentY = e.clientY;
                    //计算移动的距离
                    var spanX = currentX - oldX;
                    var spanY = currentY - oldY;
                    _this.spanBackLeft += spanX;
                    _this.spanBackTop += spanY;
                    ctx.translate(spanX, spanY);
                    _this.reShow();
                    //记录当前结果
                    oldX = currentX;
                    oldY = currentY;
                }
            }).mouseleave(function () {
                isMove = false;
                isBackMove = false;
            });
            //绑定 滚轮放大或缩小
            addMouseWheel(canvasBack[0], function (e) {
                var temp = e.delta > 0 ? 0.1 : -0.1;
                //临界值判断,如果缩小带初始大小的一半禁止缩小，放大、如果放大到源图片的1.5倍禁用放大
                var width = _this.initWidth * _this.scale;
                var height = _this.initHeight * _this.scale;
                if (temp < 0) {
                    if (width * height <= (_this.initWidth * _this.initHeight / 2)) {
                        return;
                    }
                } else {
                    if (width * height >= (_this.img.width * _this.img.height * 1.5)) {
                        return;
                    }
                }
                _this.scale += temp;
                //显示图片
                _this.reShow();
                return false;
            });

            //绑定 移动
            var isBackMove = false;
            var oldX = 0;
            var oldY = 0;
            canvasBack.mousedown(function (e) {
                isBackMove = true;
                oldX = e.clientX;
                oldY = e.clientY;
            });
            //canvasUp 变大变小绑定---四角及对应拖动事件绑定
            _this.bindSquare();
            //绑定 拖拽上传事件
            _this.bindDrag();
        },
        //绑定四个角
        bindSquare: function () {
            var _this = this;
            var _elem = this.elem;
            var _opts = this.opts;
            var imgItem = _elem.find('.imgItem');
            var canvasUp = imgItem.find('#canvasUp');
            var canvasBack = canvasUp.parent();

            var isScale = -1,
                oldX = 0,
                oldY = 0,
                oldWidth = 0,
                oldHeight = 0,
                oldLeft = 0,
                oldTop = 0;

            //右下角
            var divSquare = imgItem.find('.divSquare');
            divSquare.mousedown(function (e) {
                squareMouseDown(1, e);
                return false;
            });
            //左下角
            var divSquare_lb = imgItem.find('.divSquare_lb');
            divSquare_lb.mousedown(function (e) {
                squareMouseDown(2, e);
                return false;
            });
            //由左上角
            var divSquare_lt = imgItem.find('.divSquare_lt');
            divSquare_lt.mousedown(function (e) {
                squareMouseDown(3, e);
                return false;
            });
            //左下角
            var divSquare_rt = imgItem.find('.divSquare_rt');
            divSquare_rt.mousedown(function (e) {
                squareMouseDown(4, e);
                return false;
            });

            canvasBack.mousemove(function (e) {
                var minValue = 20;
                var pageX = e.pageX;
                var pageY = e.pageY;
                var rWidth = 0, rHeight = 0, rLeft = 0, rTop = 0;
                if (isScale == 1) {
                    //右下角
                    var spanLeft = pageX - oldX;
                    //通过比例计算
                    var spanTop = spanLeft * (_opts.targetHeight / _opts.targetWidth);
                    //计算 宽度高度和位置
                    rWidth = spanLeft + oldWidth;
                    rHeight = spanTop + oldHeight;
                    rLeft = oldLeft;
                    rTop = oldTop;
                } else if (isScale == 2) {
                    //左下角
                    //通过比例计算
                    var spanTop = pageY - oldY;
                    var spanLeft = -spanTop * (_opts.targetWidth / _opts.targetHeight);
                    //计算x坐标和高度
                    rWidth = oldWidth - spanLeft;
                    rHeight = oldHeight + spanTop;
                    //计算x轴坐标
                    rLeft = oldLeft + spanLeft;
                    rTop = oldTop;
                } else if (isScale == 3) {
                    //左上角
                    var spanLeft = pageX - oldX;
                    //通过比例计算
                    var spanTop = spanLeft * (_opts.targetHeight / _opts.targetWidth);
                    rWidth = oldWidth - spanLeft;
                    rHeight = oldHeight - spanTop;
                    rLeft = oldLeft + spanLeft;
                    rTop = oldTop + spanTop;
                } else if (isScale == 4) {
                    //右上角
                    //通过比例计算
                    var spanTop = pageY - oldY;
                    var spanLeft = -spanTop * (_opts.targetWidth / _opts.targetHeight);
                    rWidth = oldWidth + spanLeft;
                    rHeight = oldHeight - spanTop;
                    rLeft = oldLeft;
                    rTop = oldTop + spanTop;
                } else {
                    return;
                }
                //临界值过滤
                var maxWidth = canvasBack.width() - canvasUp.position().left;
                var maxHeight = canvasBack.height() - canvasUp.position().top;
                rWidth = rWidth > maxWidth ? maxWidth : rWidth;
                rHeight = rHeight > maxHeight ? maxHeight : rHeight;
                rLeft = rLeft < 0 ? 0 : rLeft;
                rTop = rTop < 0 ? 0 : rTop;

                //最小值顾虑
                //-----当前设置的Target 作为最小值
                rWidth = rWidth < _opts.targetWidth ? _opts.targetWidth : rWidth;
                rHeight = rHeight < _opts.targetHeight ? _opts.targetHeight : rHeight;
                canvasUp.css({
                    left: rLeft,
                    top: rTop
                });
                canvasUp.attr('width', rWidth).attr('height', rHeight);

                //显示结果
                _this.showTarget();
                //跟踪 设置 divSquare的位置
                _this.setSquareSite();

                return false;
            }).mouseup(function (e) {
                isScale = -1;
                return false;
            }).mouseleave(function () {
                isScale = -1;
                return false;
            });

            function squareMouseDown(number, e) {
                isScale = number;
                oldX = e.pageX;
                oldY = e.pageY;
                oldLeft = canvasUp.position().left;
                oldTop = canvasUp.position().top;
                oldWidth = canvasUp.width();
                oldHeight = canvasUp.height();
            }
        },
        //绑定拖拽事件
        bindDrag: function () {
            var _this = this;
            var _elem = this.elem.get(0);
            var inner = this.elem.parents('.coverInner');
            //1.取消浏览器默认操作
            document.ondragover = function () {
                return false;
            }
            document.ondrop = function () {
                return false;
            }
            //2.绑定拖拽事件
            _elem.ondragenter = function (e) {
                return false;
            }
            _elem.ondragover = function () {
                inner.addClass('coverInner-hot');
                return false;
            }
            _elem.ondrop = function (e) {
                var files = e.dataTransfer.files;
                if (files.length > 0) {
                    var file = files[0];
                    //验证
                    if (checkImage(file) == false)
                        return false;
                    //读取图片
                    var reader = new FileReader();
                    reader.onload = function () {
                        _this.showImg(reader.result);
                    }
                    reader.readAsDataURL(file);
                }
                inner.removeClass('coverInner-hot');
                return false;
            }

            //验证拖入的是否是图片
            function checkImage(file) {
                if (!/image\/\w+/.test(file.type)) {
                    error(file.name + "-----不是图片");
                    return false;
                }
                return true;
            }
        },
        //初始化头部
        initTop: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            // 标题、关闭按钮
            var top = getDivByClass('top');
            var title = getDivByClass('title');
            title.text(_opts.title);
            top.append(title);
            //关闭按钮
            var closeBtn = getDivByClass('closeBtn');
            closeBtn.append('<a href="javascript:void(0)" title="关闭">×</a>');
            closeBtn.click(function () {
                //关闭 按钮事件
                var result = _opts.onClose();
                if (result) {
                    _this.destroy();
                }
            });
            top.append(closeBtn);
            _elem.append(top);
        },
        //左侧
        initLeftItem: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            var middle = _elem.find('.uploader_middle');
            //左侧部分
            var left = getDivByClass('leftItem');
            middle.append(left);
            left.css({
                width: _opts.itemWidth,
                height: _opts.itemHeight
            });
            var uploadItem = getDivByClass('uploadItem');
            var upBtnDiv = getDivByClass('upBtnDiv');
            var btnDesc = getDivByClass('btnDesc');
            btnDesc.text('将图片拖入框中即可读取');
            upBtnDiv.append(btnDesc);
            //上传按钮
            upBtnDiv.append(getDivByClass('uploader'));
            uploadItem.append(upBtnDiv);
            //扩展描述
            var extention = getDivByClass('extention');
            var extStr = '';
            if (_this.uploader.opts.fileExts != '*') {
                extStr = '*仅支持' + _this.uploader.opts.fileExts + ',';
            }
            extention.text(extStr + '不超过' + getShowSize(_this.uploader.opts.maxSize));
            upBtnDiv.append(extention);
            left.append(uploadItem);
            /***********上传结果显示*************/
            var imgItem = getDivByClass('imgItem');
            imgItem.css({
                width: _opts.itemWidth,
                height: _opts.itemHeight,
                position: 'relative'
            });
            var canvas = $('<canvas id="canvasSource" width="' + _opts.itemWidth + '" height="' + _opts.itemHeight + '"></canvas>');
            canvas.css({
                position: 'absolute'
            });
            imgItem.append(canvas);
            //追加覆盖层
            var canvasBack = getDivByClass('canvasBack');
            canvasBack.css({
                width: _opts.itemWidth,
                height: _opts.itemHeight
            });
            var canvasUp = $('<canvas id="canvasUp" width="' + _opts.targetWidth + '" height="' + _opts.targetHeight + '"></canvas>');
            canvasBack.append(canvasUp);
            //追加4个角的按钮
            canvasBack.append(getDivByClass('divSquare'));
            canvasBack.append(getDivByClass('divSquare_lb'));
            canvasBack.append(getDivByClass('divSquare_lt'));
            canvasBack.append(getDivByClass('divSquare_rt'));

            imgItem.append(canvasBack);
            imgItem.hide();
            left.append(imgItem);
            //初始换上传按钮样式
            _this.initBtn();
        },
        //后侧
        initRightItem: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            var middle = _elem.find('.uploader_middle');

            var rightItem = getDivByClass('rightItem');
            rightItem.css({ height: _opts.itemHeight });
            middle.append(rightItem);

            var previewDiv = getDivByClass('previewDiv');
            var targetOneItem = getDivByClass('targetOneItem')
            var targetOne = getDivByClass('targetOne');

            var canvas = $('<canvas id="canvasTarget"><canvas/>');
            canvas.attr('width', _opts.targetWidth).attr('height', _opts.targetHeight);
            targetOne.append(canvas);
            var targetText = getDivByClass('targetText');
            targetText.text('' + _opts.targetWidth + 'px * ' + _opts.targetHeight + 'px');
            targetOneItem.append(targetOne).append(targetText);
            previewDiv.append(targetOneItem)
            rightItem.append(previewDiv);
        },
        //底部
        initBottom: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;

            var btnDiv = getDivByClass('uploader_btnDiv');
            _elem.append(btnDiv);
            //确定按钮
            var yesBtn = $('<span class="uploader_yes"/>');
            yesBtn.text('确定');
            yesBtn.click(function () {
                var thisBtn = $(this);
                if (thisBtn.text() == '正在提交...')
                    return;
                _this.submit();
                thisBtn.text('正在提交...');
            });
            //取消按钮
            var cancelBtn = $('<span  class="uploader_cancel"/>');
            cancelBtn.text('取消');
            cancelBtn.click(function () {
                _opts.onCancel(_this);
                _this.destroy();
            });
            btnDiv.append(yesBtn).append(cancelBtn);
        },
        //初始化按钮
        initBtn: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            var btn = _elem.find('.uploader');
            //上传按钮
            btn.addClass('uploader-default');
            btn.append(getDivByClass('uploader_text').text('选择图片'));
            //追加表单
            var file = getDivByClass('uploader_file');
            var form = $('<form enctype="multipart/form-data"/>');
            form.append('<input  type="file" name="file" tabindex="10000"  />');
            file.append(form);
            file.append('<input type="hidden" name="target" class="target" />');
            btn.append(file);
            //当前页面的滚动条处理
            addMouseWheel(_elem[0], function (e) {
                try {
                    e.preventDefault();
                } catch (e) {
                    return false;
                }
            });
            //初始化绑定读取文件
            _this.bindRead();
        },
        //初始化读取操作
        bindRead: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            //绑定读取事件
            var file = _elem.find('input[type=file]');
            file.change(function () {
                if (this.files.length <= 0) return;
                //扩展名 验证
                if (checkExt(this.files[0], _this.uploader.opts) == false)
                    return false;
                //读取选择文件
                var currentFile = this.files[0];
                var reader = new FileReader();
                reader.onload = function () {
                    _this.showImg(reader.result);
                }
                reader.readAsDataURL(currentFile);
            });
        },
        //设置canvasUp的位置
        setCanvasUpSite: function (left, top) {
            var _this = this;
            var canvasUp = $('#canvasUp');
            var canvasBack = canvasUp.parent();
            //临界点判断
            var maxLeft = canvasBack.width() - canvasUp.width() - 1;
            var maxTop = canvasBack.height() - canvasUp.height() - 1;
            left = left > maxLeft ? maxLeft : left;
            top = top > maxTop ? maxTop : top;
            left = left < 0 ? 0 : left;
            top = top < 0 ? 0 : top;
            //像素单位判断
            left = Math.round(left) + 1;
            top = Math.round(top) + 1;
            canvasUp.css({
                left: left,
                top: top
            });
            //跟踪 设置 divSquare的位置
            _this.setSquareSite();
            //设置图片内容
            _this.showTarget();
        },
        //跟踪设置 divSquare的位置
        setSquareSite: function () {
            var canvasUp = $('#canvasUp');
            //右下角
            $('.divSquare').css({
                left: canvasUp.position().left + canvasUp.width() - 2,
                top: canvasUp.position().top + canvasUp.height() - 2
            });
            //左下角
            $('.divSquare_lb').css({
                left: canvasUp.position().left - 2,
                top: canvasUp.position().top + canvasUp.height() - 2
            });
            //左上角
            $('.divSquare_lt').css({
                left: canvasUp.position().left - 2,
                top: canvasUp.position().top - 2
            });
            //右上角
            $('.divSquare_rt').css({
                left: canvasUp.position().left + canvasUp.width() - 2,
                top: canvasUp.position().top - 2
            });
        },
        //初始化图片加载
        showImg: function (dataUrl) {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            var leftItem = _elem.find('.leftItem');
            var uploadItem = _elem.find('.uploadItem');
            var imgItem = _elem.find('.imgItem');

            var img = new Image();
            img.onload = function () {
                //显示图片，并移动按钮
                uploadItem.hide();
                imgItem.show();
                var btnDiv = _elem.find('.uploader_btnDiv');
                if (btnDiv.find('.uploader').length == 0) {
                    var uploader = _elem.find('.uploader');
                    btnDiv.prepend(uploader.clone(true));
                    uploader.remove();
                }
                //初始化显示图片
                _this.imgReadedInit();
            }
            img.src = dataUrl;

            //重新选择文件，重设原始图片的宽度高度
            _this.img = img;
            _this.initWidth = _this.initHeight = 0;
            _this.scale = 1;


        },
        //读取图片成功后，初始化显示
        imgReadedInit: function () {
            var _this = this;
            var _opts = this.opts;
            var _elem = this.elem;
            var img = _this.img;
            var imgItem = _elem.find('.imgItem');
            //将图片显示canvas中 
            var canvas = document.getElementById('canvasSource');
            var ctx = canvas.getContext('2d');
            //缩放并显示图片
            //计算缩放后的宽度和高度
            var resultWidth = 0,
                resultHeight = 0,
                resultLeft = 0,
                resultTop = 0;
            //如果图片宽度或高度小于目标宽度或高度---禁用缩放
            if (img.width <= _opts.targetWidth || img.height <= _opts.targetHeight) {
                resultWidth = img.width;
                resultHeight = img.height;
                resultTop = (imgItem.height() - resultHeight) / 2 + 1;
                resultLeft = (imgItem.width() - resultWidth) / 2 + 1;
            } else {
                if (img.width > img.height) {
                    //以宽为标准缩放
                    resultWidth = imgItem.width();
                    var rate = resultWidth / img.width;
                    resultHeight = img.height * rate;
                    resultTop = (imgItem.height() - resultHeight) / 2 + 1;
                } else {
                    //以高为标准缩放
                    resultHeight = imgItem.height();
                    var rate = resultHeight / img.height;
                    resultWidth = img.width * rate;
                    resultLeft = (imgItem.width() - resultWidth) / 2 + 1;
                }
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            //图片像素单位处理
            resultLeft = Math.round(resultLeft);
            resultTop = Math.round(resultTop);
            resultWidth = Math.round(resultWidth);
            resultHeight = Math.round(resultHeight);
            if (_this.initWidth == 0) {
                _this.initWidth = resultWidth;
                _this.initHeight = resultHeight;
            }
            _this.reShow();
            ctx.drawImage(img, resultLeft, resultTop, resultWidth, resultHeight);
            setTimeout(function () {
                _this.showTarget();
            }, 100);
            //居中 canvasUp 
            var canvasUp = $('#canvasUp');
            _this.setCanvasUpSite((imgItem.width() - canvasUp.width()) / 2,
                (imgItem.height() - canvasUp.height()) / 2);
        },
        //重新绘制背景图片
        reShow: function () {
            var _this = this;
            var canvasSource = document.getElementById('canvasSource');
            var ctx = canvasSource.getContext('2d');
            var canvasBack = _this.elem.find('.canvasBack');

            var cWidth = canvasBack.width();
            var cHeight = canvasBack.height();

            var width = _this.initWidth * _this.scale;
            var height = _this.initHeight * _this.scale;
            //居中显示
            var left = Math.round((cWidth - width) / 2);
            var top = Math.round((cHeight - height) / 2);

            ctx.clearRect(-_this.spanBackLeft, -_this.spanBackTop, cWidth, cHeight);
            ctx.drawImage(_this.img, left, top, width, height);

            //重绘显示目标图片
            _this.showTarget();
        },
        //左侧部分图片数据，显示到右侧
        showTarget: function () {
            var canvasUp = $('#canvasUp');
            var upLeft = canvasUp.position().left;
            var upTop = canvasUp.position().top;
            var upWidth = canvasUp.width();
            var upHeight = canvasUp.height();

            var canvasSource = document.getElementById('canvasSource');
            var ctx = canvasSource.getContext('2d');
            //获取数据
            var imgArray = ctx.getImageData(upLeft, upTop, upWidth, upHeight);

            //显示到上侧
            var ctxUp = canvasUp[0].getContext('2d');
            ctxUp.putImageData(imgArray, 0, 0);
            //显示到 右侧
            var canvasTarget = document.getElementById('canvasTarget');
            var ctxTarget = canvasTarget.getContext('2d');
            ctxTarget.clearRect(0, 0, canvasTarget.width, canvasTarget.height);
            //指定底色填充，默认白色
            ctxTarget.rect(0, 0, canvasTarget.width, canvasTarget.height);
            ctxTarget.fillStyle = 'white';
            ctxTarget.fill();
            ctxTarget.drawImage(canvasUp[0], 0, 0, canvasTarget.width, canvasTarget.height);
        },
        //提交数据到服务器
        submit: function () {
            var _this = this;
            var _opts = this.uploader.opts;
            //获取图片并转换成二进制
            var imgUrl = document.getElementById('canvasTarget').toDataURL('image/jpeg', 1);
            _this.total = imgUrl.length;
            //提交图片
            _opts.targetExt = '.jpg';
            var upload = new UploadData(_this.uploader, { data: imgUrl });
            upload.onSuccess = function (data) {
                //触发事件
                if (_opts.onSuccess)
                    _opts.onSuccess(data);
                //销毁对话框
                _this.destroy();
                _this.elem.find('.uploader_yes').text('确定');
            }
        },
        //销毁操作
        destroy: function () {
            this.cover.destroy();
        }
    }
    //扩展名 验证,返回bool 值
    function checkExt(file, opts) {
        var _opts = opts;
        //执行自定义验证
        if (opts.onCheck(file) == false)
            return false;
        var val = file.name;
        if (isWechat())//如果是微信客户端不能通过文件名的后缀名验证
            return true;
        var enableList = _opts.fileExts.toLowerCase().split(';');
        var str = "文件格式不正确，仅支持：" + enableList.join(',');
        //1.获取当前上传扩展名
        if (val.length <= 0)
            return false;
        if (_opts.fileExts == '*')
            return true;
        var extension = val.substr(val.lastIndexOf('.') + 1).toLowerCase();
        if (extension.length <= 0) {
            uploadCfg.error(str);
            return false;
        }
        //2. 指定允许的后缀名数组
        for (var i = 0; i < enableList.length; i++) {
            var item = enableList[i];
            if (item == extension)
                return true;
        }
        uploadCfg.error(str);
        return false;
    }
    //判断是否是微信浏览器中打开
    function isWechat() {
        var ua = navigator.userAgent.toLowerCase();
        if (ua.match(/MicroMessenger/i) == "micromessenger") {
            return true;
        } else {
            return false;
        }
    }
    //获取指定字节大小的显示
    function getShowSize(size) {
        if (size >= 1073741824) {
            return (size / 1073741824).toFixed(1) + 'G';
        }
        if (size >= 1048576) {
            return (size / 1048576).toFixed(1) + "Mb";
        }
        return (size / 1024).toFixed(1) + 'Kb';
    }
    //获取时间显示
    function getShowTime(second) {
        if (second > 60) {
            return Math.floor(second / 60) + 'm ' + Math.round(second % 60) + 's';
        }
        return Math.round(second) + 's';
    }
    //获取div
    function getDivByClass(cls) {
        var div = $('<div />');
        div.addClass(cls);
        return div;
    }
    $.fn.uploader = function (opts) {
        var upload = new uploader(this, opts);
        upload.init();
        return upload;
    }
})(jQuery);
//绑定dom  元素的mousewheel 事件
//并设置 对应滚动的是 e.detlta  >0 向上滚动  <0  向下滚动
(function (window) {
    window.addMouseWheel = function (dom, hander) {
        if (document.mozHidden !== undefined) {
            //FF
            dom.addEventListener('DOMMouseScroll', function (e) {
                e.delta = -(e.detail || 0) / 3
                hander(e);
            })
        } else {
            if (window.addEventListener) {
                //IE,google 等
                dom.addEventListener('mousewheel', function (e) {
                    e.delta = e.wheelDelta / 120;
                    hander(e);
                });
            } else if (window.attachEvent) {
                // IE 低版本
                dom.attachEvent('onmousewheel', function (e) {
                    e.delta = e.wheelDelta / 120;
                    return hander(e);
                });
            }
        }
    }
})(window);