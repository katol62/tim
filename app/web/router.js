function AppRouter(bion) {
    var model = bion.blogic.model;
    var router = bion.web.router;
    var lwip = require('lwip');

    var pages = {
        login: {
            _access: '*',
            _partial: false,

            title: 'Админ-панель',
            url: '/admin',
            tmp: 'back/layout',
            data: {}
        },
        auth: {
            _access: '@',
            _partial: true,

            title: 'Админ-панель',
            url: '/admin/auth',
            tmp: 'back/auth',
            data: {
                menu: [
                    {
                        title: 'Группы',
                        url: '#groups'
                    },
                    {
                        title: 'Типы',
                        url: '#types'
                    },
                    {
                        title: 'Выход',
                        url: '#logout'
                    }
                ],
                groups: bion.params.group.list,
                icons: [
                    'fa-anchor',
                    'fa-cutlery',
                    'fa-car',
                    'fa-coffee',
                    'fa-home',
                    'fa-shopping-cart',
                    'fa-info-circle',
                    'fa-university',
                    'fa-building',
                    'fa-graduation-cap',
                    'fa-pied-piper-alt',
                    'fa-spoon',
                    'fa-taxi',
                    'fa-arrows',
                    'fa-building-o',
                    'fa-camera',
                    'fa-child',
                    'fa-compass',
                    'fa-desktop',
                    'fa-flag',
                    'fa-fire',
                    'fa-gift',
                    'fa-glass',
                    'fa-map-marker',
                    'fa-music',
                    'fa-phone',
                    'fa-plane',
                    'fa-road',
                    'fa-ticket',
                    'fa-truck',
                    'fa-users',
                    'fa-rub',
                    'fa-money'
                ],
                days: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
            }
        }
    };

    router.static('/static', 'app/web/static');
    router.static('/uploads', 'app/uploads');

    for (var i in pages) {
        var page = pages[i];
        page.data.title = page.title;

        router.init_page(page);
    }

    bion.web.server.post('/photos/upload', (req, res) => {
        var post = req.body;
        var params = bion.params.image;

        if (!req.files || !req.files.photo || !post || !post.id || !post.type)
            return res.status(400).json({success: false, error: 'No photo was uploaded.'});
        if (params.format.indexOf(req.files.photo.mimetype) == -1)
            return res.status(400).json({success: false, error: 'Wrong photo format.'});

        var path = bion.config.storage.files.upload_dir+post.type+'/'+post.id;

        if (!bion.storage.files.dir(path, 0755))
            return res.status(400).json({success: false, error: 'Dir creation error.'});

        var name = new Date().getTime();

        path = './'+path+'/'+name;

        req.files.photo.mv(path+'_master.jpg', err => {
            if (err) return res.status(500).json({success: false, error: err});

            lwip.open(path+'_master.jpg', (err, master) => {
                if (err) return res.status(400).json({success: false, error: 'Photo saving error:'+err});

                master.batch()
                    .resize(800, 600)
                    .crop(800, 600)
                    .writeFile(path+'_view.jpg', err => {
                        if (err) return res.status(400).json({success: false, error: 'Photo saving error:'+err});

                        master.batch()
                            .crop(600, 200)
                            .writeFile(path+'_prev.jpg', err => {
                                if (err) return res.status(400).json({success: false, error: 'Photo saving error:'+err});

                                master.batch()
                                    .resize(150, 113)
                                    .writeFile(path+'_small.jpg', err => {
                                        if (err) return res.status(400).json({success: false, error: 'Photo saving error:'+err});

                                        var photo = model.instance(post.type+'_photo');
                                        if (!photo) return res.status(400).json({success: false, error: 'Photo saving error: wrong model type "'+post.type+'"'});

                                        photo.data.name = name;
                                        photo.data[post.type+'Id'] = post.id;
                                        photo.create(id => {
                                            if (!id) return res.status(400).json({success: false, error: 'Photo saving error'});

                                            res.json({success: true, data: {
                                                id: photo.data.id,
                                                name: name,
                                                isNew: true
                                            }});
                                        });
                                    });
                            });
                    });
            });
        });
    });

    bion.web.server.post('/photos/frame_edit', (req, res) => {
        var post = req.body;
        if (!post) return res.status(500).end();

        model.static.get(post.type+'_photo', {id: post.id}, photo => {
            if (!photo) return res.status(400).json({error: 'Wrong photo id.'});

            var path = bion.config.storage.files.upload_dir+post.type+'/';
            var _model = model.instance(post.type+'_photo');

            _model.set(photo);

            switch (post.type) {
                case 'region': path += _model.data.regionId; break;
                case 'city': path += _model.data.cityId; break;
                case 'object': path += _model.data.objectId; break;
            }
            path += '/'+_model.data.name;

            lwip.open(path+'_view.jpg', (err, master) => {
                if (err) return res.status(400).json({error: 'Master photo opening error:'+err});

                var dims = {};
                dims.w = post.width*1;
                dims.h = post.height*1;
                dims.l = post.left*1;
                dims.t = post.top*1;
                dims.r = dims.l + dims.w;
                dims.b = dims.t + dims.h;

                master.batch()
                    .crop(dims.l, dims.t, dims.r, dims.b)
                    .writeFile(path+'_prev.jpg', err => {
                        if (err) return res.status(400).json({error: 'Photo saving error:'+err});

                        _model.data.props = [post.width, post.height, post.top, post.left].join('x');
                        _model.update(res2 => {res.json({success: !!res2.affectedRows, data: {}});});
                    });
            });
        });
    });

    bion.web.server.post('/photos/delete', (req, res) => {
        var post = req.body;
        if (!post || !post.id || !post.type) return res.status(500).end();

        model.static.delete(post.type+'_photo', {id: post.id}, photo => {
            if (!photo) res.status(400).json({error: 'Wrong photo id.'});

            res.json({success: true});
        });

    });
}

module.exports = AppRouter;