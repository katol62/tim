function Api(bion) {
    var log = bion.crossf.logger;
    var model = bion.blogic.model;

    var _name = null;

    var self = {
        name: 'API',
        access: {
            guest: '*',
            user: '@'
        },
        methods: {},

        response: (res, data, error) => {
            var hasErrors = !data;

            res
                //.status(!hasErrors ? 200: 500)
                .json({
                    success: !hasErrors,
                    errors: hasErrors ? error : null,
                    data: data
                });
        }
    };

    self.method = name => {
        _name = name;
        if (!self.methods[_name]) {
            self.methods[_name] = {};
        }

        return self;
    };

    self.add = (name, access, result, params) => {
        self.methods[_name][name] = {
            access: access,
            result: result,
            params: params
        };

        return self;
    };

    self.add_model = (name, access) => {
        for (var action in model.static) {
            self.methods[_name][name+"/"+action] = {
                access: self.access.user,
                result: access[action] ? model.static[action] : (params, callback) => {callback(false);}
            };
        }

        return self;
    };

    self.apply = () => {
        var name = _name;
        bion.web.server.post('/api/'+name, (req, res) => {
            var post = req.body;
            if (!post || !post.method) {
                self.response(res, false, 'Wrong API request');
                return;
            }

            var method = self.methods[name][post.method];
            if (!method) {
                self.response(res, false, 'Wrong API-'+name+' method '+post.method);
                return;
            }

            log.print(self.name, '"'+name+'/'+post.method+'" request:');
            console.log(post.data);

            if (!method.params) {
                method.params = {token: ''};
            }
            else if (!method.params.token) {
                method.params.token = '';
            }
            bion.__._.extend(method.params, post.data);

            var user = method.params.token ? _bion.users[method.params.token] : undefined;
            if (method.access === self.access.user && (!user || !user._auth)) {
                self.response(res);
                return;
            }

            var action = post.method.split('/');
            if (action[0] && action[1])
                method.result(action[0], method.params, result => {self.response(res, result);}, user);
            else
                method.result(method.params, result => {self.response(res, result);}, user);
        });
    };

    return self;
}

module.exports = Api;