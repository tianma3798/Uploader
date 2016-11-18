
/*
* jQuery dom 构建帮助 1.0
* 返回的为 jQuery 的dom对象
*/
(function () {
    var domHelper = {
        //获取div
        getDiv: function () {
            return $('<div />');
        },
        getDivByClass: function (cla) {
            var div = this.getDiv();
          
            div.addClass(cla);
            return div;
        },
        //获取span
        getSpan: function () {
            return $('<span />');
        },
        getSpanByClass: function (cla) {
            var span = this.getSpan();
            span.addClass(cla);
            return span;
        },
        //获取option
        getOption: function () {
            return $('<option/>');
        },
        getOptionByContent: function (content) {
            var option = this.getOption();
            option.html(content);
            return option;
        },
        //获取select
        getSelect: function () {
            return $('<select />');
        },
        getSelectByClass: function (cla) {
            var select = this.getSelect();
            select.addClass(cla);
            return select;
        }
    }
    window.domHelper = domHelper;
})();
/*
* 常用正则表达式封装 等1.0
*/
(function () {
    //1.去除所有空格、换行符等
    String.prototype.TrimAll = function () {
        return this.replace(/(\s|\u00A0)+/g, "");
    }
    //2.去除左右空格
    String.prototype.Trim = function () {
        return this.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, "");
    }
    //3.去除左空格
    String.prototype.LTrim = function () {
        return this.replace(/^(\s|\u00A0)*/, "");
    }
    //4.去除右空格
    String.prototype.RTrim = function () {
        return this.replace(/(\s|\u00A0)*$/g, "");
    }
    //5.字符串换 （如果当前字符串和参数相同 则返回空）
    String.prototype.ReplaceToNull = function (str) {
        if (this == str)
            return "";
        return this;
    }
    //字符串替换 （所有）
    String.prototype.ReplaceAll = function (str, target) {
        var pattern = new RegExp(str, "g");
        return this.replace(pattern, target);
    }



    /*正则验证*/
    window.Regex = {
        //手机号验证
        PhoneNumber: function (number) {
            number = number.Trim();
            if (number.length <= 0) return false;
            var regPattton = /1[3-8]+\d{9}/;
            if (regPattton.test(number))
                return true;
            return false;
        },
        //邮箱验证
        EMail: function (email) {
            email = email.Trim();
            if (email.length <= 0)
                return false;
            var regPattern = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
            return regPattern.test(email);
        },
        //QQ验证
        QQ: function (qq) {
            qq = qq.TrimAll();
            if (qq.length <= 0)
                return false;
            var regPattern = /^[1-9]\d{4,12}$/;
            return regPattern.test(qq);
        },
        //固定电话验证
        FixedPhone: function (phone) {
            phone = phone.TrimAll();
            if (phone.length <= 0)
                return false;
            var regPattern = /^(([0\+]\d{2,3}-)?(0\d{2,3})-)?(\d{7,8})(-(\d{3,}))?$/;
            return regPattern.test(phone);
        },
        //域名地址验证 格式：http://www.**.com
        SiteUrl: function (url) {
            url = url.TrimAll();
            if (url.length <= 0)
                return false;
            var regPattern = /^http:[/]{2}www.\w+.com$/;
            return regPattern.test(url);
        },
        //url地址验证
        Url: function (url) {
            url = url.TrimAll();
            if (url.length <= 0)
                return false;

            var strRegex = '^((https|http|ftp|rtsp|mms)?://)'
                + '?(([0-9a-z_!~*\'().&=+$%-]+: )?[0-9a-z_!~*\'().&=+$%-]+@)?' //ftp的user@ 
                + '(([0-9]{1,3}.){3}[0-9]{1,3}' // IP形式的URL- 199.194.52.184 
                + '|' // 允许IP和DOMAIN（域名） 
                + '([0-9a-z_!~*\'()-]+.)*' // 域名- www. 
                + '([0-9a-z][0-9a-z-]{0,61})?[0-9a-z].' // 二级域名 
                + '[a-z]{2,6})' // first level domain- .com or .museum 
                + '(:[0-9]{1,4})?' // 端口- :80 
                + '((/?)|' // a slash isn't required if there is no file name 
                + '(/[0-9a-z_!~*\'().;?:@&=+$,%#-]+)+/?)$';
            var re = new RegExp(strRegex);
            return re.test(url);
        },
        //正整数验证
        PositiveInteger: function (number) {
            number = number.TrimAll();
            if (number.length <= 0)
                return false;

            var regStr = /^[0-9]*[1-9][0-9]*$/;
            var re = new RegExp(regStr);
            return re.test(number);
        },


        //浏览器版本验证 
        //禁用IE内核number(默认8) 以下的浏览器
        navigatorFileter: function (number) {
            var userAgent = window.navigator.userAgent.toLowerCase();
            if (number == undefined)
                number = 8;
            if (window.navigator.appName == "Microsoft Internet Explorer") {
                try {
                    var version = userAgent.match(/msie ([\d.]+)/)[1];
                    version = parseInt(version);
                    if (version < number) {
                        alert("网站暂不支持，IE7内核以下的浏览器，为了更好的体验请升级或使用其他浏览器。");
                        window.close();
                    }
                } catch (e) {
                }
            }
        }
    }
})();
/*
* 滚动条 常用方法封装
*/
(function () {
    /*******window滚动条**********/
    window.scrollHelper = {
        //1. 1秒钟 滚动到指定位置
        scrollTop: function (top) {
            $('body,html').stop(true, false).animate({
                scrollTop: top
            }, 1000);
        },
        //2. 1秒钟 滚动到 dom对象的位置
        scrollTo: function (dom) {
            scrollHelper.scrollTop(dom.offset().top);
        },
        //3. 1秒钟 滚动到 文档头部
        scrollToTop: function () {
            scrollHelper.scrollTop(0);
        },
        //1秒钟  滚动到 完档的底部
        scrollToBottom: function () {

        }
    }
})();


/*
*  window.urlHelper
*  浏览器 地址栏 操作帮助类
*/
(function () {
    var urlHelper = {
        //获取地址栏中的ID  http://....../xxx.html
        getUrlID: function () {
            var url = this.getHref();
            var number = url.substr(url.lastIndexOf('/') + 1);
            number = number.substr(0, number.indexOf('.'));
            return number;
        },
        //获取地址栏 url 全路径
        getHref: function () {
            return window.location.href.toLowerCase();
        },
        //获取地址栏 参数部分
        getParams: function () {
            return window.location.search;
        },
        //为地址栏 设置参数-----参数统一小写
        setParams: function (params) {
            params = params.toLowerCase();
            window.location.href =
                window.location.href.replace(window.location.search, '')
                + '?' + params;
        },
        //获取 地址栏 参数key对应的值--key不区分大小写
        getQueryString: function (name) {
            var reg = new RegExp("(^|&)" + name.toLowerCase() + "=([^&]*)(&|$)");
            var r = window.location.search.substr(1).match(reg);
            if (r != null)
                return r[2];
            return "";
        },
        //页面跳转--当前页面,统一小写
        open: function (url) {
            window.location.href = url.toLowerCase();
        },
        //页面跳转---新窗口，统一小写
        openNew: function (url) {
            window.open(url.toLowerCase(), '_blank');
        },
        //判断地址栏中是否有指定的字符串---不区分大小写
        isContain: function (str) {
            str = str.toLowerCase();
            var url = this.getHref();

            if (url.indexOf(str) == -1)
                return false;
            return true;
        }
        //向地址栏中添加参数
    }
    window.urlHelper = urlHelper;
})();