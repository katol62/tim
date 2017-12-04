module.exports = bion => {
    var model = bion.blogic.model;
    var api = bion.serv.api;
    var helper = bion.crossf.helper;

    api.method('user')
        .add(
            'init',
            api.access.guest,
            (params, callback) => {
                var user = bion.web.user(bion);
                user.init(params, callback);
            }
        )
        .add(
            'auth',
            api.access.guest,
            (params, callback, user) => {
                if (!params || !params.token || !params.login || !params.password) {
                    callback(false);
                    return false;
                }

                user.auth(params.login, params.password, callback);
            },
            {
                login: '',
                password: ''
            }
        )
        .add(
            'listing',
            api.access.guest,
            (params, callback) => {
                var listing = {};
                var where = ['active', '=', 1];

                model.static.list('region', {where: where}, _regions => {
                    _regions.map(region => {
                        region.pics.map((pic, id) => {region.pics[id] = abs_image_path('region', region.id, pic.name);});
                        listing[region.id] = region;
                    });

                    model.static.list('city', {where: where}, _cities => {
                        _cities.map(city => {
                            if (!listing[city.regionId]) return;

                            city.pics.map((pic, id) => {city.pics[id] = abs_image_path('city', city.id, pic.name);});
                            delete city.objects;
                            listing[city.regionId].cities[city.id] = city;
                        });

                        model.static.list('object', {where: where}, _objects => {
                            _objects.map(obj => {
                                if (!listing[obj.regionId] || !listing[obj.regionId].cities[obj.cityId]) return;

                                obj.pics.map((pic, id) => {obj.pics[id] = abs_image_path('object', obj.id, pic.name);});
                                listing[obj.regionId].cities[obj.cityId].recs[obj.id] = obj;
                            });

                            callback(listing);
                        });
                    });
                });
            }
        )
        .add(
            'types',
            api.access.guest,
            (params, callback) => {
                model.static.list('type', {}, types => {
                    var groups = helper.array_to_obj(bion.params.group.list, 'id');
                    types.map((type, i) => {
                        types[i].group = groups[types[i].groupId].title;
                        delete types[i].groupId;
                        type.options.map((opt, j) => {
                            delete types[i].options[j].typeId;
                            delete types[i].options[j].type;
                        });
                    });
                    
                    callback(types);
                });
            }
        )
        .apply();

    function abs_image_path(type, id, name) {
        var config = bion.config.web;
        return 'http://'+(config.host_name ? config.host_name : config.host)+':'+config.port+'/uploads/'+type+'/'+id+'/'+name+'_view.jpg';
    }
};