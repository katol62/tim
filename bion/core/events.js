function Events(bion) {
    var _events = new EventEmitter();

    var self = {
        prefix: 'bion',
        delimiter: '.',

        add: (module, data) => {
            _events.on(_key(module), data);
        },
        addonce: (module, data) => {
            _events.once(_key(module), data);
        },
        listen: (module, callback) => {
            _events.emit(_key(module), callback);
        }
    };

    function _key(module) {
        return self.prefix+self.delimiter+module;
    }

    return self;
}

module.exports = Events;