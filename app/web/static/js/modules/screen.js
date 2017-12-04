function Screen(user, ui) {
    var types = [
        'region',
        'city',
        'object'
    ];
    var history = [];

    var self = {
        dom: {
            main: '#content',
            list: '#views .list_view',
            edit: '#views .edit_view',
            backlink: '.header .back',
            title: '.header h3 span',
            info: '.more-info'
        },
        active: {
            view: 'list',
            type: 'region',
            r: {id: null, title: '', img: '', desc: ''},
            c: {id: null, title: '', img: '', desc: ''},
            o: {id: null}
        },
        history: {},
        data: null,
        object: new ItemObject(),

        _do: (method, data, loader, callback) => {
            if (!loader) {
                user.api(method, data, callback);
                return;
            }

            ui.loader(true, () => {
                user.api(method, data, res => {
                    ui.loader(false, () => {callback && callback(res);});
                });
            });
        },

        imageEditor: new ImageEditor()
    };

    self.init = (callback, _default) => {
        if (_default) self.active = _default;
        $(self.dom.main+' '+self.dom.backlink).on('click', self.backlink);
        $('body').on('click', self.dom.main+' '+self.dom.list+' .list > .add', () => {
            (new Item()).new();
            return false;
        });

        self.object.init(() => {
            self.render(callback);
        });
    };
    self.history.add = () => {
        var view = $.extend({}, self.active);
        view.r = $.extend({}, self.active.r);
        view.c = $.extend({}, self.active.c);
        view.o = $.extend({}, self.active.o);

        history.push(view);
        if (history.length > 5) history.shift();
    };
    self.history.last = () => {return history.pop();};
    self.backlink = () => {
        if (self.active.view == 'edit' &&  !$('.save_object').hasClass('disabled') && !confirm('Изменения не будут сохранены. Вы уверены, что хотите вернуться?')) return false;
        var prev = self.history.last();
        if (!prev) return false;

        self.active = prev;
        self.data = null;
        self.render();

        return false;
    };
    self.render = callback => {
        request(res => {
            //console.log('RENDER:', self.active);
            $(self.dom.main+' '+self.dom.backlink).css({
                display: self.active.view == 'list' && self.active.type == 'region' ? 'none' : 'block'
            });

            var view = $(self.dom[self.active.view]);
            $('#views .view.active').removeClass('active');
            view.addClass('active');

            if (self.active.view == 'edit') {
                self.object.display(self.data);
            }
            else {
                var title = $(self.dom.list+' '+self.dom.title);
                var info = $(self.dom.list+' '+self.dom.info);
                if (self.active.type == 'region') {
                    title.text('Регионы');
                    info.addClass('hide');
                    info.find('.preview-image').attr('src', '');
                    info.find('.desc').text('');
                }
                else if (self.active.type == 'city') {
                    title.text(self.active.r.title);
                    info.removeClass('hide');
                    info.find('.preview-image').attr('src', self.active.r.img);
                    info.find('.desc').text(self.active.r.desc);
                }
                else if (self.active.type == 'object') {
                    title.text(self.active.c.title);
                    info.removeClass('hide');
                    info.find('.preview-image').attr('src', self.active.c.img);
                    info.find('.desc').text(self.active.c.desc);
                }

                var list = $(self.dom.list+' ul');
                list.html('');
                self.data.map(item => {self.item_to_list(item);});
                list.sortable({
                    placeholder: 'sortable_ph',
                    helper: 'clone',
                    stop: self.sort
                }).disableSelection();
            }

            callback && callback();
        });
    };
    self.sort = callback => {
        var pos = {};
        $(self.dom.list+' ul .item').each(function() {
            pos[$(this).index()] = $(this).attr('data-id');
        });

        self._do('sort', {
            type: self.active.type,
            pos: pos
        }, false);
    };
    self.item_to_list = (data, item) => {
        if (!item) var item = new Item(data);
        $(self.dom.list+' ul').append(item.dom);
    };
    self.alert = (message, type) => {
        if (!type) type = 'success';
        if (type == 'error') type = 'danger';

        var block = $(
            '<div class="alert alert-dismissible alert-'+type+'">'+
                '<button type="button" class="close" data-dismiss="alert">&times;</button>'+
                '<strong>'+message+'</strong>'+
            '</div>'
        );

        $('#alerts').append(block);

        setTimeout(() => {block.remove();}, 5000);
    };

    function request(callback) {
        var url = self.active.type+'/';
        url += self.active.view == 'list' ? 'list' : 'get';
        var post = {};
        if (self.active.view == 'edit') post.id = self.active.o.id;
        else if (self.active.type == 'city') post.regionId = self.active.r.id;
        else if (self.active.type == 'object') post.cityId = self.active.c.id;

        self._do(url, post, true, data => {
            if (!data) {
                self.alert('Ошибка загрузки данных', 'error');
                return;
            }
            self.data = data;

            callback(!!data);
        });
    }
    function Item(data) {
        var _item = {
            dom: $('<li class="item">'+
                '<div class="block panel panel-default">'+
                    '<div class="panel-body">'+
                        '<a class="act btn btn-info" href="#"></a>'+
                        '<div class="image_block">'+
                            '<img class="img-thumbnail" src="/static/img/no_photo_small.png" alt="" />'+
                            '<i class="edit fa fa-3x fa-pencil-square-o"></i>'+
                        '</div>'+
                        '<div class="name">'+
                            '<h4 class="title"></h4>'+
                            '<p class="desc"></p>'+
                        '</div>'+
                        '<div class="group"></div>'+
                        '<div class="type"></div>'+
                        '<a class="del btn btn-primary" href="#"><i class="fa fa-trash-o fa-lg"></i></a>'+
                    '</div>'+
                '</div>'+
                '<a class="add btn btn-success" href="#"><i class="fa fa-plus fa-lg"></i></a>'+
            '</li>'),
            data: {}
        };

        _item.val = (key, value) => {
            switch (key) {
                case 'id':
                    _item.dom.attr('data-id', value);
                    break;

                case 'active':
                    var btn = _item.dom.find('.act');
                    if (value) {
                        btn.text('Выкл').addClass('active');
                        _item.dom.addClass('active');
                    }
                    else {
                        btn.text('Вкл').removeClass('active');
                        _item.dom.removeClass('active');
                    }
                    break;

                case 'name':
                    _item.dom.find('.title').text(value);
                    break;

                case 'brief':
                    _item.dom.find('.desc').text(value);
                    break;

                case 'pics':
                    _item.dom.find('img').attr('src', value && value.length ? image_path(self.active.type, _item.data.id, value[0].name) : '/static/img/no_photo_small.png');
                    break;

                case 'typeId':
                    var type_dom = _item.dom.find('.type');
                    if (!value) {
                        type_dom.html('');
                        break;
                    }

                    var type = self.object.types.list[value];
                    var group = $('#type_group option[value="'+type.groupId+'"]').text();
                    type_dom.html(
                        '<span class="label label-danger" data-toggle="tooltip" data-placement="top" title="" data-original-title="Группа">'+group+'</span>'+
                        '<i class="fa fa-arrow-right"></i>'+
                        '<span class="label label-info" data-toggle="tooltip" data-placement="bottom" title="" data-original-title="Тип">'+
                            (type.icon ? '<i class="icon fa '+type.icon+'"></i>': '')+
                            type.title+
                        '</span>'
                    );
                    break;
            }
            _item.data[key] = value;

            return _item;
        };
        //init
        if (data) for (var i in data) _item.val(i, data[i]);

        _item.new = callback => {
            var _new = {
                name: 'Новый',
                active: 0
            };

            if (self.active.type == 'city') _new.regionId = self.active.r.id;
            else if (self.active.type == 'object') {
                _new.regionId = self.active.r.id;
                _new.cityId = self.active.c.id;
            }

            self._do(self.active.type+'/'+'add', _new, true, new_id => {
                if (!new_id) {
                    self.alert('Ошибка создания записи!', 'error');
                    delete _new;
                    return;
                }
                _new.id = new_id;
                if (self.active.view == 'list') self.item_to_list(_new);
                self.sort();
                self.alert('Запись создана!');
            });

            return false;
        };
        _item.delete = callback => self._do(self.active.type+'/'+'delete', {id: _item.data.id}, true, callback);
        _item.activate = callback => self._do(self.active.type+'/'+'active', {id: _item.data.id, active: _item.data.active}, true, callback);

        _item.dom.find('.block').on('click', () => {
            self.history.add();
            switch (self.active.type) {
                case 'region':
                    self.active.type = 'city';
                    self.active.r.id = _item.data.id;
                    self.active.r.title = _item.data.name;
                    self.active.r.desc = _item.data.brief;
                    self.active.r.img = _item.data.pics && _item.data.pics.length ? image_path('region', _item.data.id, _item.data.pics[0].name, 'prev') : '/static/img/no_photo_prev.png';
                    break;

                case 'city':
                    self.active.type = 'object';
                    self.active.c.id = _item.data.id;
                    self.active.c.title = _item.data.name;
                    self.active.c.desc = _item.data.brief;
                    self.active.c.img = _item.data.pics && _item.data.pics.length ? image_path('city', _item.data.id, _item.data.pics[0].name, 'prev') : '/static/img/no_photo_prev.png';
                    break;

                case 'object':
                    self.active.view = 'edit';
                    self.active.o.id = _item.data.id;
                    break;
            }

            self.render();
        });

        _item.dom.find('.add').on('click', _item.new);
        _item.dom.find('.del').on('click', () => {
            if (!confirm('Вы уверены, что хотите удалить запись?')) return false;

            _item.delete(res => {
                if (!res) {
                    self.alert('Ошибка удаления записи!', 'error');
                    return;
                }
                _item.dom.remove();
                delete _item;
                self.alert('Запись удалена!');

                return false;
            });

            return false;
        });
        _item.dom.find('.act').on('click', () => {
            _item
                .val('active', _item.data.active ? 0 : 1)
                .activate(res => {
                    if (!res) {
                        self.alert('Ошибка активации записи!', 'error');
                        return;
                    }
                    self.alert('Запись '+(_item.data.active ? 'включена' : 'выключена')+'!');

                    return false;
                });

            return false;
        });
        _item.dom.find('.image_block').on('click', () => {
            self.history.add();
            self.active.view = 'edit';
            self.active.o.id = _item.data.id;
            self.render();

            return false;
        });

        return _item;
    }
    function ItemObject() {
        var _obj = {
            dom: {
                title: '.obj_title',
                save: '.save_object',
                photos: '.photos',
                additionaly: '#additionaly',
                options: '#options',
                type: '.types',
                form: '#obj_form',
                form_photo: '#photo_form',
                form_photo_file: '#photo_file'
            },
            data: {},
            changed: false,
            photos: {
                dom: '<div class="photo well">'+
                    '<img class="img-rounded" src="">'+
                    '<i class="edit fa fa-2x fa-pencil-square-o"></i>'+
                    //'<a href="#" class="act btn btn-info">Выкл</a>'+
                    '<a href="#" class="del btn btn-primary"><i class="fa fa-trash-o fa-lg"></i></a>'+
                '</div>',
                count: 3
            },
            ymap: Map(),
            types: Types(),
            times: Times()
        };

        _obj.init = callback => {
            _obj.types.init(() => {
                $('body')
                    .on('click', _obj.dom.title+' span', function() {
                        dom('title').html(
                            '<div class="form-group">'+
                                '<input id="title" class="form-control" type="text" name="obj[title]" value="'+$(this).text()+'"/>'+
                                '<a id="title_ok" class="btn btn-success" href="#">Ок</a>'+
                            '</div>'
                        );
                    })
                    .on('click', '#title_ok', function() {
                        var title = $('#title').val();
                        if (title) dom('title').html('<span>'+title+'</span>');
                        if (title !== _obj.data.name) dom('save').removeClass('disabled');
                        return false;
                    });
                dom('form').on('change', 'input, textarea, select', () => {dom('save').removeClass('disabled');});
                dom('save').on('click', _obj.save);
                dom('form_photo_file').on('change', () => {
                    var loader = $('.photo-load');
                    var bar = $('.photo-load .progress-bar');

                    $('#photo_id').val(_obj.data.id);
                    $('#photo_type').val(self.active.type);

                    dom('form_photo').ajaxForm({
                        beforeSend: () => {
                            bar.width('0%');
                            loader.css('display', 'block');
                        },
                        uploadProgress: (event, position, total, progress) => {
                            bar.width(progress+'%');
                        },
                        success: res => {
                            loader.css('display', 'none');
                            if (!res || !res.success) {
                                self.alert('Ошибка загрузки изображения', 'error');
                                return;
                            }

                            if (res.data) _obj.photos.add(res.data);
                            self.alert('Изображение загружено');
                        }
                    }).submit();
                    return false;
                });

                _obj.times.init();
                _obj.ymap.init(callback, () => {dom('save').removeClass('disabled');});
            });
        };
        _obj.display = data => {
            _obj.data = data;
            //console.log('DATA:', _obj.data);
            dom('save').addClass('disabled');

            var photos = dom('photos');
            photos.html('');
            _obj.photos.add();
            for (var i in _obj.data.pics) _obj.photos.add(_obj.data.pics[i]);
            photos.sortable({
                item: 'photo',
                cancel: '.add',
                placeholder: 'sortable_ph',
                stop: () => {
                    var pos = {};
                    dom('photos').find('.photo:not(.add)').each(function() {
                        pos[$(this).index()] = $(this).attr('data-id');
                    });

                    user.api('sort', {
                        type: self.active.type+'_pics',
                        pos: pos
                    });
                }
            });

            refresh_form();

            var type = dom('type');
            var options_tab = dom('form').find('.options_tab');
            switch (self.active.type) {
                case 'region':
                    type.addClass('hide');
                    options_tab.addClass('hide');
                    _obj.ymap.render(undefined, _obj.data.poly);
                    break;

                case 'city':
                    type.addClass('hide');
                    options_tab.addClass('hide');
                    _obj.ymap.render(_obj.data.center, _obj.data.poly);
                    break;

                case 'object':
                    type.removeClass('hide');
                    options_tab.removeClass('hide');
                    _obj.ymap.render(_obj.data.geo);
                    _obj.photos.count = 5;
                    _obj.times.render(_obj.data.times);
                    _obj.types.set(_obj.data.typeId);
                    break;
            }

            var additionaly = dom('additionaly');
            additionaly.find('.option').addClass('hide');
            additionaly.find('.'+self.active.type).removeClass('hide');
        };
        _obj.options_set = () => {
            var options = dom('options');
            options.html('');

            if (!_obj.data.typeId) return;

            var type_opts = _obj.types.list[_obj.data.typeId].options;
            type_opts.map(opt => {options.append(option_dom(opt));});
            _obj.data.options.map(opt => {dom('options').find('#option_'+opt.typeId).val(opt.value)});
        };
        _obj.save = () => {
            var form = dom('form');
            var post = {
                id: _obj.data.id,
                name: dom('title').text(),
                brief: form.find('#brief').val(),
                full: form.find('#full').val()
            };

            switch (self.active.type) {
                case 'region':
                    post.capitalId = $('#capitalId').val();
                    post.poly = _obj.ymap.data.poly;
                    break;

                case 'city':
                    post.radius = $('#radius').val();
                    post.center = _obj.ymap.data.pos;
                    post.poly = _obj.ymap.data.poly;
                    break;

                case 'object':
                    post.typeId = _obj.data.typeId;
                    post.geo = _obj.ymap.data.pos;
                    post.phone = $('#phone').val();
                    post.tags = $('#tags').val();
                    post.times = _obj.times.values();
                    post.options = [];
                    dom('options').find('.obj_option').each((i, line) => {
                        line = $(line);
                        post.options.push({
                            id: line.attr('data-id'),
                            value: line.find('input').val()
                        });
                    });
                    break;
            }
            //console.log('POST:', post);

            self._do(self.active.type+'/'+'edit', post, true, res => {
                self.alert(res ? 'Данные успешно сохранены!' : 'Ошибка сохранения данных!', res ? false : 'error');
                dom('save').addClass('disabled');
            });
        };
        _obj.photos.add = data => {
            var photo = $(_obj.photos.dom);
            if (!data) {
                photo.addClass('add').html('+');
                dom('photos').append(photo);
                photo.on('click', () => {dom('form_photo_file').trigger('click');});
                return;
            }

            photo
                .attr('data-id', data.id)
                .find('img').attr('src', image_path(self.active.type, _obj.data.id, data.name));
            if (data.props) photo.attr('data-props', data.props);

            var add = dom('photos').find('.add');
            add.before(photo);
            if (dom('photos').find('.photo:not(.add)').length == _obj.photos.count) add.remove();

            photo.on('click', function() {photo_view(photo.find('img').attr('src').replace('_small', '_view'));});
            photo.find('.edit').on('click', function() {
                self.imageEditor.init(
                    _obj.data.name,
                    photo.find('img').attr('src').replace('_small', '_view'),
                    data.id,
                    self.active.type,
                    photo.attr('data-props') ? photo.attr('data-props').split('x') : null,
                    () => {dom('form_photo_file').trigger('click');},
                    id => {
                        dom('photos').find('.photo[data-id="'+id+'"]').remove();
                        if (!dom('photos').find('.add').length) _obj.photos.add();
                        self.alert('Изображение удалено!');
                    },
                    props => {photo.attr('data-props', props.join('x'));}
                );

                return false;
            });
            photo.find('.del').on('click', function() {
                if (!confirm('Вы уверены, что хотите удалить изображение?')) return false;

                var id = $(this).closest('.photo').attr('data-id');

                $.ajax({
                    url: '/photos/delete',
                    type: "POST",
                    async: true,
                    data: {
                        id: id,
                        type: self.active.type
                    },
                    success: res => {
                        dom('photos').find('.photo[data-id="'+id+'"]').remove();
                        if (!dom('photos').find('.add').length) _obj.photos.add();
                        self.alert('Изображение удалено!');
                        $(options.modal).modal('hide');
                    }
                });

                return false;
            });
        };

        function refresh_form() {
            dom('form').find('input, textarea, select').val('');

            dom('title').find('span').text(_obj.data.name);
            dom('form').find('#brief').val(_obj.data.brief);
            dom('form').find('#full').val(_obj.data.full);

            switch (self.active.type) {
                case 'region':
                    self._do('city/list', {regionId: _obj.data.id}, false, cities => {
                        if (!cities) {
                            self.alert('Ошибка запроса списка городов!', 'error');
                            return;
                        }

                        var capital = $('#capitalId');
                        function option(id, name) {return $('<option value="'+id+'">'+name+'</option>');}

                        capital.html('').append(option('', 'Не выбран'));
                        cities.map(city => {capital.append(option(city.id, city.name));});
                        if (_obj.data.capitalId) capital.val(_obj.data.capitalId);
                    });
                    break;

                case 'city':
                    $('#radius').val(_obj.data.radius);
                    break;

                case 'object':
                    $('#phone').val(_obj.data.phone);
                    $('#tags').val(_obj.data.tags);
                    break;
            }
        }
        function dom(id) {return $(self.dom.edit+' '+_obj.dom[id]);}
        function option_dom(opt) {
            var input;

            if (opt.type == 1 || opt.type == 2) {
                var type = opt.type == 1 ? 'text' : 'number';
                input = '<input id="option_'+opt.id+'" class="form-control" type="'+type+'" name="option['+opt.id+']" />';
            }

            return $('<div class="obj_option form-group" data-id="'+opt.id+'">'+
                '<label for="option_'+opt.id+'" class="col-sm-3 control-label">'+opt.name+'</label>'+
                '<div class="col-sm-8">'+input+'</div>'+
            '</div>');
        }

        return _obj;
    }
    function Types() {
        var _self = {
            dom: {
                btn: '.types',
                add: '.add',
                list: 'ul',
                modal: '#types_modal'
            },
            list: {}
        };

        _self.init = callback => {
            self._do('type/list', {}, false, list => {
                if (!list) {
                    self.alert('Ошибка загрузки типов', 'error');
                    return;
                }
                list.map(type => {_self.to_list(type);});

                $('body')
                    .on('click', _self.dom.btn+' '+_self.dom.list+' .type', function() {
                        _self.set($(this).attr('data-id'), true);
                    })
                    .on('click', _self.dom.btn+' '+_self.dom.list+' .edit', function() {
                        var type = _self.list[$(this).closest('.type').attr('data-id')];

                        if (!type) return false;

                        $('#type_id').val(type.id);
                        $('#type_group').val(type.groupId);
                        $('#type_title').val(type.title);
                        $(_self.dom.modal+' .icon[name="'+type.icon+'"]').trigger('click');

                        var options = $('#type_options .list');
                        options.html('');
                        type.options.map(option => {options.append(option_dom(option))});

                        $(_self.dom.modal).modal('show');

                        return false;
                    })
                    .on('click', _self.dom.btn+' '+_self.dom.list+' .del', function() {
                        var type = _self.list[$(this).closest('.type').attr('data-id')];

                        if (!type || !confirm('Вы уверены, что хотите удалить данный тип?')) return false;

                        self._do('type/delete', {id: type.id}, true, res => {
                            if (!res) {
                                self.alert('Ошибка удаления типа', 'error');
                                return;
                            }

                            $(this).closest('.type').remove();
                            delete _self.list[type.id];
                            self.alert('Тип удалён');
                        });

                        return false;
                    });
                dom('add').on('click', function() {
                    $('#type_id').val('');
                    $('#type_group').val(1);
                    $('#type_title').val('');
                    $(_self.dom.modal+' .icon.active').removeClass('active');
                    $('#type_options .list').html('');

                    $(_self.dom.modal).modal('show');
                });

                $(_self.dom.modal)
                    .on('click', '.icon', function() {
                        $(_self.dom.modal+' .icon.active').removeClass('active');
                        $(this).addClass('active');
                    })
                    .on('click', '.modal-footer .btn-primary', function() {
                        var id = $('#type_id').val();
                        var _edit = !!id;
                        var icon = $(_self.dom.modal+' .icon.active');
                        var type = {
                            groupId: $('#type_group').val(),
                            title: $('#type_title').val(),
                            icon: icon ? icon.attr('name') : '',
                            options: []
                        };

                        var empty_option_name = false;
                        $('#type_options .list .option').each((i, option) => {
                            option = $(option);
                            var name = option.find('.name').val();
                            if (!name) {
                                empty_option_name = true;
                                return false;
                            }

                            type.options.push({
                                id: option.attr('data-id'),
                                name: name,
                                type: option.find('.type').val()
                            });
                        });

                        if (empty_option_name || !type.title) return false;
                        if (_edit) type.id = id;

                        self._do('type/'+(_edit ? 'edit' : 'add'), type, true, res => {
                            //console.log('RES:', res);
                            if (!res) {
                                self.alert('Ошибка '+(_edit ? 'редактирования' : 'создания')+' типа', 'error');
                                return;
                            }

                            type.options = res.options;

                            if (!_edit) {
                                type.id = res.id;
                                _self.to_list(type);
                            }
                            else {
                                var _type = dom('list').find('.type[data-id="'+type.id+'"]');
                                _type.find('a').text(type.title);
                                _type.find('.icon').attr('class', 'icon fa '+type.icon);
                                _self.list[type.id] = type;
                                if (self.object.data.typeId == type.id) self.object.options_set();
                            }
                            $(_self.dom.modal).modal('hide');
                            self.alert('Тип '+(_edit ? 'изменён' : 'создан'));
                        });

                        return false;
                    })
                    .on('click', '#type_options .add', function() {
                        $('#type_options .list').append(option_dom());
                        return false;
                    })
                    .on('click', '#type_options .del', function() {
                        if (!confirm('Вы уверены, что хотите удалить опцию?')) return false;
                        $(this).closest('.option').remove();
                    });

                callback();
            });
        };
        _self.to_list = type => {
            _self.list[type.id] = type;

            dom('list').prepend('<li class="type" data-id="'+type.id+'">'+
                '<i class="icon fa '+(type.icon ? type.icon : 'fa-minus-circle')+'"></i>'+
                '<a href="#">'+type.title+'</a>'+
                '<i class="edit fa fa-pencil"></i>'+
                '<i class="del fa fa-times"></i>'+
            '</li>');
        };
        _self.set = (id, edit) => {
            if (edit && self.object.data.options.length && !confirm('Вы уверены, что хотите изменить тип объекта? Значения всех опций при этом будут стёрты!')) return false;

            var list = dom('list');

            $(_self.dom.btn+' .current i').attr('class', id ? 'fa '+_self.list[id].icon : '');
            $(_self.dom.btn+' .current .title').html(id ? _self.list[id].title : 'Тип');
            list.find('.type.active').removeClass('active');
            if (id) list.find('.type[data-id="'+id+'"]').addClass('active');


            if (edit) {
                self.object.data.typeId = id || 0;
                self.object.data.options = [];
                $('.save_object').removeClass('disabled');
            }
            self.object.options_set();
        };

        function dom(id) {return $(_self.dom.btn+' '+_self.dom[id]);}
        function option_dom(opt) {
            return $('<div class="form-group option" data-id="'+(opt ? opt.id : '')+'">'+
                '<div class="col-sm-6"><input class="name form-control" type="text" name="option[name]" value="'+(opt && opt.name ? opt.name : '')+'" /></div>'+
                '<div class="col-sm-5">'+
                    '<select class="type form-control" name="option[type]">'+
                        '<option value="1"'+(opt && opt.type == 1 ? ' selected' : '')+'>Текст</option>'+
                        '<option value="2"'+(opt && opt.type == 2 ? ' selected' : '')+'>Число</option>'+
                    '</select>'+
                '</div>'+
                '<div class="col-sm-1"><i class="del fa fa-trash-o fa-2x"></i></div>'+
            '</div>');
        }

        return _self;
    }

    return self;
}
