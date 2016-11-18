/// <reference path="../jquery-1.9.0.js" />

/**
* 简单弹出层，弹出框 3.0
* 注:
*  1.dialog 依赖于 cover
*  2.整个控件在页面中最多出现一次，多次调用只保留最后一次，其他自动销毁
*  3.添加 top，left只用于指定距离浏览器窗口上边缘和左边缘的距离
*  4.对话框垂直方向内容超出添加滚动条
*  5.添加 onOpen/onDestroy 事件
*/
/***********弹出层 封装***********/
(function () {
    /******************************覆盖层********************************/
    var Cover = function (opts) {
        var defaults = {
            width: 'auto',
            height: 'auto',
            top: 'auto',
            left: 'auto',
            innerMargin: 30,//水平方向距离两端的空白
            html: '<h3>Hello world<br><br></h3>',
            onOpen: function (container) { },// 打开完成时触发,传入当前container
            onDestroy: function () { }, //当销毁时触发
            clickDestroy: true,//指定在点击背景的时候是否自动消失，默认为true
            autoDestroy: false,//指定是否自动销毁，默认为false
            destroyTime: 1500,//指定自动销毁 的时间，默认1800
            borderRadius: '5%',//设置边角
            resize: true,//指定是否随浏览器的重置而重置位置
            destroyType: 'fadeOut',//消失的方式，slideUp-向上卷出，fadeOut-渐变消失
            scrollHide: false  //指定是否自动隐藏滚动条
        }
        this.opts = $.extend({}, defaults, opts);
    }
    function getDivByClass(cla) {
        var div = $('<div />');
        div.addClass(cla);
        return div;
    }
    Cover.prototype = {
        //初始化
        init: function () {
            var _this = this;
            var _opts = this.opts;
            //创建容器
            _this.createContainer();
            _this.initContainer();
            //创建内容
            _this.createInner();
            _this.initInner();
            //创建显示完成--触发onOpen
            if (_opts.onOpen) {
               _opts.onOpen(_this.getContainer());
            }
            //控制自动消失
            if (_opts.autoDestroy == true) {
                setTimeout(function () {
                    _this.destroy();
                }, _opts.destroyTime);
            }
        },
        //销毁
        destroy: function () {
            var _this = this;
            var _opts = this.opts;
            var container = _this.getContainer();
            var inner = _this.getInner();
            //inner.css('box-shadow','none');
            //inner.fadeOut('fast');
            if (_opts.destroyType == 'slideUp') {
                inner.animate({
                    height: 0,
                    padding: 0
                }, 'fast', function () {
                    inner.remove();
                });
                container.animate({
                    height: 0
                }, 'slow', function () {
                    //销毁成功
                    container.remove();
                    $('html,body').removeClass('bodyOver');
                    if (_opts.onDestroy)
                        _opts.onDestroy();
                });
            } else if (_opts.destroyType == 'fadeOut') {
                inner.fadeOut('normal');
                container.fadeOut('slow', function () {
                    //销毁成功
                    container.remove();
                    $('html,body').removeClass('bodyOver');
                    if (_opts.onDestroy)
                        _opts.onDestroy();
                });
            }
        },
        //修改内容
        setHtml: function (html) {
            var _this = this;
            var inner = _this.getInner();

            inner.find('.coverContent').html(html);
        },
        //创建容器
        createContainer: function () {
            var _this = this;
            var _opts = this.opts;
            //创建容器
            $('.coverContainer').remove();
            var container = getDivByClass('coverContainer');
            //创建背景
            var back = getDivByClass('coverBack');
            if (_opts.clickDestroy == true) {
                back.off('click').on('click', function () {
                    _this.destroy();
                    return false;
                })
            }
            container.append(back);
            //追加到文档
            if (_opts.scrollHide) {
                $('html,body').addClass('bodyOver');
            }
            $(document.body).append(container);
            //窗口重置事件绑定
            if (_opts.resize) {
                $(window).off('resize').on('resize', function () {
                    _this.initInner();
                })
            }
        },
        //设置容器样式和位置
        initContainer: function () {
            var _this = this;
            var _opts = this.opts;
            var container = _this.getContainer();
            //设置位置
            container.css({
                left: 0,
                top: 0
            });
        },
        //获取 coverContainer jquery对象
        getContainer: function () {
            return $('.coverContainer');
        },
        //创建内容
        createInner: function () {
            var _this = this;
            var _opts = this.opts;
            //内部
            var coverUp = getDivByClass('coverUp');
            var inner = getDivByClass('coverInner');
            var content = getDivByClass('coverContent');
            content.html(_opts.html);
            inner.append(content);
            coverUp.append(inner);

            $('.coverContainer').append(coverUp);
        },
        //设置内容样式和位置
        initInner: function () {
            var _this = this;
            var _opts = this.opts;
            var container = _this.getContainer();
            var inner = _this.getInner();
            //inner.show();
            inner.fadeIn('normal');
            setTimeout(function () {
                inner.addClass('coverInner-show ');
            }, 30);
            inner.css('border-radius', _opts.borderRadius);
            //设置宽度和高度
            if (_opts.width == 'auto') {
                inner.width(container.width() - _opts.innerMargin * 2);
            }
            else {
                inner.width(_opts.width);
            }
            if (_opts.height != 'auto') {
                inner.height(_opts.height);
            }
            //设置位置
            var top = (container.height() - inner.height()) / 2;
            if (_opts.top != 'auto') {
                top = _opts.top;
            }
            var left = (container.width() - inner.outerWidth()) / 2;
            if (_opts.left != 'auto') {
                left: _opts.left;
            }
            inner.css({
                left: left,
                top: top
            });
        },
        //获取 coverInner jquery 对象
        getInner: function () {
            return $('.coverInner');
        }
    }
    //注册方法
    $.cover = function (opts) {
        var cover = new Cover(opts);
        cover.init();
        return cover;
    }
})(jQuery);

/***************自定义dialog ******************/
(function () {
    //当前控件依赖于 Cover2.0
    var Dialog = function (opts) {
        var defaults = {
            width: 500,
            height: 320,
            top: 'auto',
            left: 'auto',
            showIcon: true,
            title: '用户名',
            content: '<h5>hello word</h5><div class="testBack"></div><div class="innerSite"></div>',
            onOpen: function (container) { },// 打开完成时触发,传入当前container
            onDestroy: function () { }, //当销毁时触发
            padding: '10px 20px',
            enableMove: true, //是否可以移动
            clickDestroy: false,//是否 点击背景自动消失
            showCloseBtn: true,//指定是否显示关闭按钮
            resizeSite: true, //指定是否在窗口重置的时候重置dialog 的位置
            showTest: true  //显示测试内容
        }
        this.opts = $.extend({}, defaults, opts);
    }
    function getDivByClass(cla) {
        var div = $('<div />');
        div.addClass(cla);
        return div;
    }

    Dialog.prototype = {
        //初始化
        init: function () {
            var _this = this;
            var _opts = this.opts;
            //创建覆盖层
            var cover = $.cover({
                width: _opts.width,
                height: _opts.height,
                top: _opts.top,
                left: _opts.left,
                clickDestroy: _opts.clickDestroy,
                innerMargin: 0,
                borderRadius: 10,
                resize: _opts.resizeSite
            });
            _this.cover = cover;
            //创建容器
            _this.createContainer();
            //打开成功-触发 onOpen
            if (_opts.onOpen) {
                _opts.onOpen(_this.getContainer());
            }
        },
        //设置 内容
        setContent: function (html) {
            var _this = this;
            var container = _this.getContainer();
            container.find('.dialogInnerContent').html(html);
        },
        //设置 标题
        setTitle: function (title) {
            var _this = this;
            var titleBar = _this.getTitleBar();
            titleBar.find('.dialogTitle').html(title);
        },
        //设置 icon
        setIcon: function (iconCls) {
            var _this = this;
            var titleBar = _this.getTitleBar();
            titleBar.find('.dialogIcon').addClass(iconCls);
        },
        //创建容器
        createContainer: function () {
            var _this = this;
            var _cover = this.cover;
            var container = getDivByClass('dialogContainer');
            var inner = _cover.getInner();
            inner.empty().append(container);

            _this.initContainer();
            //创建标题栏
            _this.createTitleBar();
            _this.bingTitleBar();
            //创建内容
            _this.createInnter();
        },
        //设置容器的样式
        initContainer: function () {
            var _this = this;
            var _opts = this.opts;
            var container = _this.getContainer();
            //设置宽度和高度
            container.css({
                width: _opts.width,
                height: _opts.height
            });
        },
        //获取容器 jquery对象
        getContainer: function () {
            return $('.dialogContainer');
        },
        //创建标题栏
        createTitleBar: function () {
            var _this = this;
            var _opts = this.opts;
            var container = _this.getContainer();

            var titleBar = getDivByClass('dialogTitleBar');
            //创建 icon
            if (_opts.showIcon) {
                var icon = getDivByClass('dialogIcon');
                titleBar.append(icon);
            }
            //标题
            var title = getDivByClass('dialogTitle');
            title.html(_opts.title);

            titleBar.append(title);
            container.append(titleBar);
            //创建关闭按钮
            _this.createCloseBtn();
        },
        //绑定工具栏事件
        bingTitleBar: function () {
            var _this = this;
            var _cover = this.cover;
            var _opts = this.opts;
            var titleBar = _this.getTitleBar();
            var back = _cover.getContainer();
            //选中事件
            titleBar.on('selectstart', function () {
                return false;
            });
            //可移动------计算方式相对于左上角位置不变
            if (_opts.enableMove) {
                var inner = _cover.getInner();
                var spanLeft = 0, spanTop = 0, isMove = false;
                titleBar.mousedown(function (e) {

                    isMove = true;
                    spanLeft = e.pageX - inner.position().left;
                    spanTop = e.pageY - inner.position().top;

                    return false;
                });

                back.mousemove(function (e) {
                    if (isMove) {
                        var left = e.pageX - spanLeft;
                        var top = e.pageY - spanTop;
                        inner.css({
                            left: left,
                            top: top
                        });
                    }
                });
                $(document).mouseup(function () {
                    isMove = false;
                    spanLeft = 0;
                    spanTop = 0;
                });
            }
        },
        //获取标题栏
        getTitleBar: function () {
            return $('.dialogTitleBar');
        },
        //创建关闭按钮
        createCloseBtn: function () {
            var _this = this;
            var _cover = this.cover;
            var closeBtn = getDivByClass('closeBtn');

            closeBtn.text("×");
            closeBtn.off('click').on('click', function () {
                _this.destroy();
            });
            var titleBar = _this.getTitleBar();
            titleBar.append(closeBtn);
            titleBar.append(getDivByClass('clear'));
        },
        //创建内部内容
        createInnter: function () {
            var _this = this;
            var _opts = this.opts;
            var container = _this.getContainer();
            var inner = getDivByClass("dialotInner");
            var content = getDivByClass('dialogInnerContent');
            content.html(_opts.content);
            inner.append(content);
            inner.css('padding', _opts.padding);
            container.append(inner);
        },
        //获取 内部dialogInnerContent
        getDialogInnerContent: function () {
            return $('.dialogInnerContent');
        },
        //销毁对话框
        destroy: function () {
            this.cover.destroy();
            var _opts = this.opts;
            if (_opts.onDestroy)
                _opts.onDestroy();
        }
    }
    //注册方法
    $.dialog = function (opts) {
        var dialog = new Dialog(opts);
        dialog.init();
        return dialog;
    }
})(jQuery);
