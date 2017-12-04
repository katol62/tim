global._bion = {
    users: {}
};

function BION() {
    var bodyParser = require('body-parser');
    var express = require('express');
    var fileUpload = require('express-fileupload');
    var EventEmitter = require('events').EventEmitter;

    var self = {
        name: 'BION',

        config: require('./config'),
        events: require('./core/events'),
        serv: {},
        web: {
            express: express,
            server: express(),
            tpl: require('pug')
        },
        __: {
            _: require('underscore'),
            FS: require('fs'),
            AS: require('async')
        }
    };

    self.params = require('./core/params')(self);

    _include('crossf', 'bion/crossf', 'Cross-functions loaded!');
    _include('storage', 'bion/daccess/storage', 'Storage drivers loaded!');
    _include('blogic', 'bion/blogic', 'Business logic loaded!');

    // web server
    self.web.server.locals.basedir = self.config.web.basedir;
    self.web.server.set('view engine', 'pug');
    self.web.server.use(bodyParser.json());
    self.web.server.use(bodyParser.urlencoded({
        extended: true
    }));
    self.web.server.use(fileUpload());
    self.web.server.listen(self.config.web.port, self.config.web.host ? self.config.web.host : undefined);
    // web router
    self.web.router = require('./web/ui/router')(self);
    require('../app/web/router')(self);
    // web user
    self.web.user = require('./web/ui/user');

    // services api
    self.serv.api = require('./web/services/api')(self);
    self.__.FS.readdirSync('./app/web/api').forEach(file => {
        require('../app/web/api/'+file.split('.')[0])(self);
    });

    function _include(name, path, success) {
        if (!self[name]) {
            self[name] = {};
        }
        self.__.FS.readdirSync('./'+path).forEach(file => {
            var filename = file.split('.')[0];
            self[name][filename] = require('../'+path+'/'+filename)(self);
        });

        self.crossf.logger.print(self.name, success);
    }

    return self;
}

module.exports = BION();