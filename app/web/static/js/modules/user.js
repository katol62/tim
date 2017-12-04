function User() {
    var self = {
        token: null,
        login: null,

        data: {
            name: null,
            email: null,
            phone: null
        },

        _auth: false
    };

    self.init = (token, callback) => {
        if (token) {
            self.token = token;
        }
        self.api('init', {}, res => {
            if (!res) {
                console.log('User init fail!');
                callback(false);
                return false;
            }

            self.token = res.token;
            console.log('User init success!');
            if (res.login) {
                self.login = res.login;
                self._auth = true;
                console.log('Autologin!');
            }
            callback(true);
        });
    };

    self.auth = (data, callback) => {
        if (self._auth) {
            callback(false);
            return false;
        }

        self.api('auth', data, res => {
            if (!res) {
                console.log('User auth fail!');
                callback(false);
                return false;
            }

            self.login = data.login;
            self._auth = true;

            console.log('User auth success!');
            callback(true);
        });
    };

    self.api = (method, data, callback) => {
        data.token = self.token;

        $.ajax({
            url: '/api/admin',
            type: 'POST',
            data: {
                method: method,
                data: data
            },
            success: res => {
                if (!res || !res.success) {
                    console.log('API-'+name+' '+method+' request errors:', data, res);
                    callback && callback(false);
                    return false;
                }

                callback && callback(res.data);
            }
        });
    };

    return self;
}