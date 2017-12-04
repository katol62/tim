module.exports = bion => {
    console.log();
    if (!bion.config.storage.cache.enabled) return;

    var log = bion.crossf.logger;
    var helper = bion.crossf.helper;

    var client = require("redis").createClient();
    var types = {
        item: {
            key: 'item'
        },
        list: {
            key: 'list'
        },
        auth: {
            key: 'auth'
        }
    };

    var self = {
        name: 'REDIS',

        prefix: '_cache',
        separator: ':'
    };

    self.get = (id, callback) => {
        var key = id.split(self.separator);
        var type = key[0];
        switch (type) {
            case types.item:
                client.zget(keyprepare(types[type].key, key[1]), id, (err, item) => {
                    reshandler(err, item, callback);
                });
            break;

            case types.list:
                client.zget(keyprepare(types[type].key, key[1], id), (err, items) => {
                    reshandler(err, items, callback);
                });
            break;

            case types.auth:

            break;
        }
    };

    self.set = (id, data) => {

    };

    function keyprepare(type, obj, id) {
        var key = [self.prefix, type, obj];
        id && key.push(id);
        return key.join(self.separator);
    }

    function reshandler(err, res, callback) {
        if (err) {
            log.print(self.name, 'Error: ' + err);
            callback(false);
            return false;
        }

        callback(res);
        return true;
    }

    return self;
}