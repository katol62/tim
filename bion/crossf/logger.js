function Logger(platform) {
    var self = {

    };

    self.print = (module, message, error) => {
        console.log(_time()+' ['+module+']', error ? '[ERROR]' : '[INFO]', message);
    };

    self.debug = data => {
        console.log(_time()+'[DEBUG]', data);
    };

    function _time() {
        var now = new Date();
        return now;
        //return _full(now.getDay())+'/'+_full(now.getMonth())+'/'+now.getFullYear()+' '+
        //    _full(now.getHours())+':'+_full(now.getMinutes())+':'+_full(now.getSeconds())+'.'+now.getMilliseconds();
    }
    function _full(val) {return val*1 < 10 ? '0'+val : val;}

    // init
    console.log(' -----------------------------');
    console.log('| BiOn application is running |');
    console.log(' -----------------------------');
    console.log(' ', ' ');

    return self;
}

module.exports = Logger;