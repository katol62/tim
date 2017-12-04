function Instance(bion, model) {
    var db = bion.storage.db;

    var self = {
        types: {
            auto: 'auto',
            int: 'int',
            text: 'text',
            flag: 'flag',
            model: 'model',
            array: 'array'
        },

        model: bion.__._.extend({
            name: '',
            rows: {}
        }, model),
        data: {},
        errors: null
    };

    self.set = data => {
        for (var param in data) {
            if (!self.model.rows[param]) continue;
            self.data[param] = data[param];
        }

        return self;
    };
    self.create = (callback, validate) => {
        if (validate && !self.validate()) {
            callback(null);
            return;
        }

        var q = {
            name: self.model.name,
            data: self.data
        };

        db.insert(q, id => {
            if (id) self.data.id = id

            callback(id);
        });
    };
    self.read = (params, callback) => {
        var q = {
            rows: params.rows || '*',
            name: self.model.name,
            where: {and: []},
            order: params.order,
            limit: params.limit
        };
        params.multi = !params.id && !params.by;

        if (params.where) q.where.and.push(params.where);
        if (params.id) q.where.and.push(['id', Array.isArray(params.id) ? 'IN' : '=', params.id]);
        if (params.by) q.where.and.push([params.by[0], '=', params.by[1]]);

        db.select(q, res => {
            if (!res) {
                callback(null);
                return;
            }

            if (!Array.isArray(res)) res = [res];

            bion.__.AS.map(res, self.format, (err, res) => {
                if (err) {
                    callback(null);
                    return;
                }

                callback(params.multi ? res : res[0]);
            });
        });
    };
    self.update = (callback, validate) => {
        if (validate && !self.validate()) {
            callback(null);
            return;
        }

        var data = {};
        for (var key in self.data) {
            var value = self.data[key];
            if (self.model.rows[key].type == self.types.int && !value) data[key] = "NULL";
            else data[key] = value;
        }
        var q = {
            name: self.model.name,
            data: data
        };

        db.update(q, callback);
    };
    self.delete = callback => {
        var q = {
            name: self.model.name,
            data: self.data
        };

        db.delete(q, res => {
            if (res) self.data = {};
            callback(res);
        });
    };
    self.validate = () => {
        /*for (var i in model) {
         var attr = model[i];
         //console.log(i, attr);

         if (attr.type === self.types.auto) {
         _this[i] = _new_id();
         continue;
         }
         else if (data[i] === undefined && attr.default !== undefined) {
         _this[i] = attr.default;
         continue;
         }

         _this[i] = data[i];
         }*/

        return true;
    };
    self.format = (data, callback) => {
        var formatted = {};
        var keys = Object.keys(self.model.rows);
        var formatter = i => {
            i++;
            if (i == keys.length) {
                callback(null, formatted);
                return;
            }

            var key = keys[i];
            var row = self.model.rows[key];
            var sync = true;
            var val = data[key];

            if (!val && row.type != self.types.model && row.type != self.types.array) {
                formatted[key] = null;
                formatter(i);
                return;
            }


            switch (row.type) {
                case self.types.auto:
                case self.types.int:
                    formatted[key] = val*1;
                    break;

                case self.types.text:
                    formatted[key] = val+'';
                    break;

                case self.types.flag:
                    formatted[key] = !!val;
                    break;

                case self.types.model:
                    if (!data[row.key]) {
                        formatted[key] = null;
                        formatter(i);
                        return;
                    }
                    sync = false;
                    bion.blogic.model.static.get(row.model, {
                        id: data[row.key]
                    }, model => {
                        formatted[key] = model;
                        formatter(i);
                    });
                    break;

                case self.types.array:
                    if (row.key) {
                        sync = false;
                        bion.blogic.model.static.list(row.model, {
                            where: [row.key, '=', data.id]
                        }, rows => {
                            formatted[key] = rows;
                            formatter(i);
                        });
                    }
                    else {
                        formatted[key] = row.model ? {} : val;
                    }
                    break;
            }

            sync && formatter(i);
        };
        formatter(-1);
    };

    return self;
}

module.exports = bion => {
    var model_path = 'app/models/';
    var log = bion.crossf.logger;
    var models = {};

    var self = {
        name: 'MODELS',
        static: {}
    };

    // init
    bion.__.FS.readdirSync('./'+model_path).forEach(file => {
        var filename = file.split('.')[0];
        models[filename] = require('../../'+model_path+filename);
    });

    self.instance = type => {
        if (!type || !models[type]) {
            log.print(self.name, 'Wrong model type: '+type, true);
            return null;
        }

        return new Instance(bion, models[type]);
    };
    self.static.list = (type, params, callback, user) => {
        var instance = new Instance(bion, models[type]);
        var _params = bion.__._.extend({
            where: null
        }, params);

        if (params.regionId || params.cityId)
            _params.where = [params.regionId ? 'regionId' : 'cityId', '=', params.regionId ? params.regionId : params.cityId];
        if (instance.model.rows.pos && instance.model.rows.pos.type == instance.types.int) {
            _params.order = "pos ASC";
        }

        instance.read(_params, callback);
    };
    self.static.get = (type, params, callback, user) => {new Instance(bion, models[type]).read(params, callback);};
    self.static.add = (type, params, callback, user) => {new Instance(bion, models[type]).set(params).create(callback, true);};
    self.static.edit = (type, params, callback, user) => {
        var instance = new Instance(bion, models[type]);
        instance.read({id: params.id}, res => {
            if (!res) {
                callback(null);
                return;
            }
            instance.set(params).update(callback, true);
        });
    };
    self.static.delete = (type, params, callback, user) => {
        var instance = new Instance(bion, models[type]);
        instance.read({id: params.id}, res => {
            if (!res) {
                callback(null);
                return;
            }
            instance.set(params).delete(callback);
        });
    };
    self.static.active = (type, params, callback, user) => {
        var instance = new Instance(bion, models[type]);
        instance.read({id: params.id}, res => {
            if (!res) {
                callback(null);
                return;
            }
            instance.set(params).update(callback);
        });
    };

    return self;
};