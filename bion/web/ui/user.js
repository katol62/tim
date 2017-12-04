function User(bion) {
    var log = bion.crossf.logger;
    var helper = bion.crossf.helper;
    var model = bion.blogic.model;

    var access_types = {
        all: '*',
        users: '@',
        guests: '?'
    };

    var self = {
        token: null,
        login: null,
        //lang: bion.crossf.lang.default,

        data: {
            name: null,
            email: null,
            phone: null
        },

        _auth: false
    };

    self.init = (params, callback) => {
        if (!params.token) {
            self.token = helper.gen_id();
            _bion.users[self.token] = self;

            log.print('USER', 'User #' + self.token + ' initialized..');
            callback({token: self.token});
            return;
        }

        var user = _bion.users[params.token];
        if (!user) {
            callback(false);
            return;
        }
        user._auth = true;
        log.print('USER', 'User #' + user.token + ' initialized and logged in');

        callback({token: user.token, login: user.login});
    };

    self.auth = (login, password, callback) => {
        if (self._auth) {
            callback(false);
            return false;
        }

        model.static.get('user', {by: ['email', login]}, user => {
            if (!user || user.password != password) {
                callback(false);
                return;
            }

            self.login = user.email;
            self._auth = true;

            log.print('USER', 'User #'+self.token+' logged in as "'+self.login+'"');

            callback(true);
        });
    };

    self.page_access = page => {
        return page._access === access_types.all ||
            (page._access === access_types.users && self._auth) ||
            (page._access === access_types.guests && !self._auth);
    };

    self.validate = () => {

    };

    return self;
}

module.exports = User;