function Interface(user) {
    var _token = 'bionToken';
    var pages = {};

    var self = {
        dom: {
            loader: $('#loader'),
            login: $('#login'),
            admin_block: $('#admin_block'),
            content: $('.container')
        },
        page: {},
        screen: {},
        _data: localStorage
    };

    self.init = data => {
        self.screen = data.screen(user, self);

        self.loader(true, () => {
            var token = self._data.getItem(_token);
            user.init(token, res => {
                if (!res) {
                    if (token) {
                        self._data.setItem(_token, '');
                        location.reload();
                    }
                    return false;
                }

                self.loader(false, !user._auth ? login : self.page.screen);
            });
        });
    };

    self.page.screen = callback => {
        var content = self.dom.content;
        self.page.load('/admin/auth', html => {
            content.animate({opacity: 0}, 200, () => {
                content.html(html);
                self.screen.init(() => {
                    content.animate({opacity: 1}, 300, callback);
                });
            });
        });
    };

    self.page.load = (name, callback) => {
        var page = pages[name];
        if (page && page.html) {
            callback(page.html);
            return;
        }
        if (!page) pages[name] = {
            name: name,
            html: ''
        }

        $.ajax({
            url: name,
            type: 'POST',
            data: {token: user.token},
            success: res => {
                if (!res || !res.html) {
                    console.log('Page loading fail!');
                    callback(false);
                    return false;
                }

                pages[name].html = res.html;
                callback && callback(res.html);
            }
        });
    };

    self.loader = (show, callback) => {
        show && self.dom.loader.css('display', 'block');
        self.dom.loader.animate({opacity: show ? 0.5 : 0}, 200, () => {
            !show && self.dom.loader.css('display', 'none');
            callback && callback();
        });
    };

    function login() {
        var dom = self.dom.login;
        var form = dom.find('form');
        form.css("left", 10);

        dom.find('.btn').on('click', () => {
            var _login = dom.find('.login').val();
            var _passw = dom.find('.passw').val();

            if (!_login || !_passw) return false

            user.auth({login: _login, password: _passw}, res => {
                if (!res) {
                    dom.find('.login, .passw')
                        .closest('.form-group').addClass('has-error');
                    return;
                }

                //console.log('USER AUTH res:', res);
                self._data.setItem(_token, user.token);
                form.css("left", -302);
                self.dom.loader.animate({opacity: 0}, 500, () => {self.loader(false, self.page.screen);});
            });

            return false;
        });
        return;
    }

    return self;
}