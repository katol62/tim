function Lang(platform) {
    var localize = require('localize');
    var locals = {};

    var self = {
        path: 'app/locals',
        default: 'ru'
    };

    platform.__.FS.readdirSync('./'+self.path).forEach(file => {
        var lname = file.split('.')[0];
        var _local = require('../../'+self.path+'/'+lname);

        for (var type in _local) {
            for (var name in _local[type]) {
                var _name = type + '.' + name;
                if (!locals[_name]) {
                    locals[_name] = {};
                }
                locals[_name][lname] = _local[type][name];
            }
        }
    });

    var __ = new localize(locals);

    self.trans = (local, mess) => {
        __.setLocale(local);
        return __.translate(mess);
    }

    return self;
}

module.exports = Lang;