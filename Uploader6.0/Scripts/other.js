////根据当前缓冲区控制客户端读取速度
//if (_this.socket.ws.bufferedAmount > 1204 * 1024 * 3) {
//    //console.info('发送缓存区：' + _this.socket.ws.bufferedAmount);
//    var thisTimer = setInterval(function () {
//        //console.log('------>进入200毫秒等待');
//        if (_this.socket.ws.bufferedAmount <= 1204 * 1024) {
//            // console.log('------>进入等待结束');
//            clearInterval(thisTimer);
//            //继续读取
//            _this.loadSuccess(e.loaded);
//        }
//    }, 10);
//} else {
//    //继续读取
//    _this.loadSuccess(e.loaded);
//}