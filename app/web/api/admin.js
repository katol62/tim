module.exports = bion => {
    var api = bion.serv.api;
    var model = bion.blogic.model;
    var helper = bion.crossf.helper;

    api.method('admin')
        .add_model('user', {list: true, get: true, add: true, edit: true, delete: true, active: true})
        .add_model('region', {list: true, get: true, add: true, edit: true, delete: true, active: true})
        .add_model('city', {list: true, get: true, add: true, edit: true, delete: true, active: true})
        .add_model('object', {list: true, get: true, add: true, edit: true, delete: true, active: true})
        .add_model('type', {list: true, get: true, add: true, edit: true, delete: true})
        .add_model('region_photo', {edit: true, delete: true, active: true})
        .add_model('city_photo', {edit: true, delete: true, active: true})
        .add_model('object_photo', {edit: true, delete: true, active: true})
        .add(
            'init',
            api.access.guest,
            (params, callback) => {
                var user = new bion.web.user(bion);
                user.init(params, callback);
            }
        )
        .add(
            'auth',
            api.access.guest,
            (params, callback, user) => {
                if (!params || !params.token || !params.login || !params.password || !user) {
                    callback(false);
                    return;
                }

                user.auth(params.login, params.password, callback);
            },
            {
                login: '',
                password: ''
            }
        )
        .add(
            'sort',
            api.access.user,
            (params, callback, user) => {
                if (!params || !params.token || !params.type || !params.pos || !user) {
                    callback(false);
                    return;
                }

                var table;
                var rows = [];
                switch (params.type) {
                    case 'region': table = 'regions';break;
                    case 'city': table = 'cities';break;
                    case 'object': table = 'objects';break;

                    case 'region_pics': table = 'region_photos';break;
                    case 'city_pics': table = 'city_photos';break;
                    case 'object_pics': table = 'object_photos';break;
                }
                params.pos.map((id, pos) => {rows.push({id: id*1, pos: pos*1})});
                bion.__.AS.each(rows, (row, callback2) => {
                    bion.storage.db.update({
                        name: table,
                        data: row
                    }, res => {callback2(!res);});
                }, err => {callback(!err);});
            }
        )
        .add(
            'clone',
            api.access.user,
            (params, callback, user) => {
                if (!params || !params.token || !params.type || !params.id || !user) {
                    callback(false);
                    return;
                }

                model.static.get(params.type, {id: params.id}, _model => {
                    if (!_model) {
                        callback(false);
                        return;
                    }

                    delete _model.id;
                    delete _model.pics;
                    delete _model.cities;
                    delete _model.recs;
                    _model.name += '_копия';
                    _model.active = _model.active ? 1 : 0;

                    model.instance(params.type).set(_model).create(callback);
                });
            }
        )
        .add(
            'type/add',
            api.access.user,
            (notused, params, callback, user) => {
                if (!params || !params.token || !params.groupId || !params.title || !user) {
                    callback(false);
                    return;
                }
                var options = params.options || [];
                delete params.options;

                model.instance('type').set(params).create(new_id => {
                    if (!new_id) {
                        callback(false);
                        return;
                    }

                    var result = {
                        id: new_id,
                        options: []
                    };
                    if (!options) {
                        callback(result);
                        return;
                    }
                    bion.__.AS.each(options, (option, callback2) => {
                        var new_opt = {
                            typeId: new_id,
                            name: option.name,
                            type: option.type
                        };
                        model.instance('type_option')
                            .set(new_opt)
                            .create(new_opt_id => {
                                if (new_opt_id) {
                                    new_opt.id = new_opt_id;
                                    result.options.push(new_opt);
                                }
                                callback2(!new_opt_id);
                            });
                    }, err => {callback(!err ? result : false);});
                });
            }
        )
        .add(
            'type/edit',
            api.access.user,
            (notused, params, callback, user) => {
                if (!params || !params.token || !params.id || !params.groupId || !params.title || !user) {
                    callback(false);
                    return;
                }
                var options_new = params.options || [];
                delete params.options;

                model.static.edit('type', params, res => {
                    if (!res || !res.affectedRows) {
                        callback(false);
                        return;
                    }

                    model.static.list('type_option', {where: ['typeId', '=', params.id]}, options_old => {
                        var not_changed_ids = [];
                        var for_add = [];
                        var for_edit = [];
                        var for_edit_ids = [];
                        var for_delete_ids = [];
                        var old_by_id = helper.array_to_obj(options_old, 'id');
                        var new_options = [];

                        //console.log('option data:', options_new, options_old, old_by_id);
                        options_new.map(opt => {
                            if (!opt.id) for_add.push({name: opt.name, type: opt.type*1});
                            else if (old_by_id[opt.id].name != opt.name || old_by_id[opt.id].type != opt.type) {
                                for_edit.push(opt);
                                for_edit_ids.push(opt.id*1);
                            }
                            else {
                                not_changed_ids.push(opt.id*1);
                                new_options.push(opt);
                            }
                        });

                        options_old.map(opt => {
                            !helper.in_array(for_edit_ids, opt.id) &&
                            !helper.in_array(not_changed_ids, opt.id) &&
                            for_delete_ids.push(opt.id);
                        });

                        //console.log('options for:', for_add, for_edit, for_delete_ids);
                        bion.__.AS.series([
                            add_callback => {
                                if (!for_add.length) {
                                    add_callback(false);
                                    return;
                                }
                                bion.__.AS.each(for_add, (option, add_callback2) => {
                                    option.typeId = params.id;
                                    model.instance('type_option')
                                        .set(option)
                                        .create(new_id => {
                                            if (new_id) {
                                                option.id = new_id;
                                                new_options.push(option);
                                            }
                                            add_callback2(!new_id);
                                        });
                                }, err => {add_callback(err);});
                            },
                            edit_callback => {
                                if (!for_edit.length) {
                                    edit_callback(false);
                                    return;
                                }
                                bion.__.AS.each(for_edit, (option, edit_callback2) => {
                                    model.static.edit('type_option', option, res => {
                                        if (!res || !res.affectedRows) {
                                            edit_callback2(true);
                                            return;
                                        }

                                        bion.storage.db.update({
                                            name: model.instance('object_option').model.name,
                                            data: {value: ''},
                                            where: {and: [['typeId', '=', option.id]]}
                                        }, res2 => {
                                            if (res2) new_options.push(option);
                                            edit_callback2(!res2);
                                        });
                                    });
                                }, err => {edit_callback(err);});
                            },
                            delete_callback => {
                                if (!for_delete_ids.length) {
                                    delete_callback(false);
                                    return;
                                }
                                bion.storage.db.delete({
                                    name: model.instance('type_option').model.name,
                                    data: {id: for_delete_ids}
                                }, res => {
                                    if (!res || !res.affectedRows) {
                                        delete_callback(true);
                                        return;
                                    }

                                    bion.storage.db.delete({
                                        name: model.instance('object_option').model.name,
                                        where: {and: [['typeId', 'IN', for_delete_ids]]}
                                    }, res2 => {delete_callback(!res2)});
                                });
                            }
                        ], err => {callback(!err ? {options: new_options} : false);});
                    });
                });
            }
        )
        .add(
            'object/edit',
            api.access.user,
            (notused, params, callback, user) => {
                if (!params || !params.token || !params.id || !user) {
                    callback(false);
                    return;
                }

                var options_new = params.options || [];
                delete params.options;

                model.static.edit('object', params, res => {
                    if (!res || !res.affectedRows) {
                        callback(false);
                        return;
                    }

                    model.static.list('object_option', {where: ['objectId', '=', params.id]}, options_old => {
                        var old_by_type_id = helper.array_to_obj(options_old, 'typeId');
                        var old_type_ids = Object.keys(old_by_type_id);

                        bion.__.AS.each(options_new, (opt, callback2) => {
                            if (!helper.in_array(old_type_ids, opt.id))
                                model.static.add('object_option', {
                                    objectId: params.id,
                                    typeId: opt.id,
                                    value: opt.value
                                }, new_id => {callback2(!new_id);});
                            else {
                                old_type_ids.splice(old_type_ids.indexOf(opt.id), 1);
                                model.static.edit('object_option', {
                                    id: old_by_type_id[opt.id].id*1,
                                    value: opt.value
                                }, res => {callback2(!(res && res.affectedRows));});
                            }
                        }, err => {
                            if (err) {
                                callback(false);
                                return;
                            }

                            //console.log('options:', options_new, old_by_type_id, old_type_ids);
                            if (!old_type_ids.length) {
                                callback(true);
                                return;
                            }

                            bion.storage.db.delete({
                                name: model.instance('object_option').model.name,
                                where: {and: [
                                    ['objectId', '=', params.id],
                                    ['typeId', 'IN', old_type_ids]
                                ]}
                            }, res2 => {callback(true)});
                        });
                    });
                });
            }
        )
        .apply();
};