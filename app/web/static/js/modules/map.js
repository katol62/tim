function Map() {
    var center = [45.32359471957162, 34.413538444787285];

    var self = {
        dom: {
            block: '.map_block',
            map_id: 'map',
            btns: '.btn-group',
            act: '.act',
            clear: '.clear',
            pos: '.pos',
            poly: '.poly'
        },
        set: {},

        _map: null,
        data: {
            pos: '',
            poly: ''
        },
        type: 'pos',
        on_change: null
    };

    self.init = (callback, on_change) => {
        ymaps.ready(() => {
            dom('clear').on('click', self.set.clear);
            dom('pos').on('click', function() {
                self._map.geoObjects.removeAll();
                dom('btns').find('.active').removeClass('active');
                $(this).addClass('active');
                self.type = 'pos';

                self.set.pos_editor();

                return false;
            });
            dom('poly').on('click', function() {
                self._map.geoObjects.removeAll();
                dom('btns').find('.active').removeClass('active');
                $(this).addClass('active');
                self.type = 'poly';

                self.set.poly_editor();

                return false;
            });

            self._map = new ymaps.Map(self.dom.map_id, {
                center: center,
                zoom: 8,
                type: "yandex#map"
            });

            self.on_change = on_change;

            console.log('Map init success');
            callback();
        });
    }
    self.render = (pos, poly) => {
        if (!self._map) return;
        //self.set.act(true);

        var edit_pos = pos !== undefined;
        var edit_poly = poly !== undefined;
        var btns = dom('btns');

        self.data.pos = pos;
        self.data.poly = poly;
        self.type = edit_pos ? 'pos' : 'poly';

        self._map.geoObjects.removeAll();
        edit_pos && edit_poly ? btns.show() : btns.hide();
        edit_pos ? self.set.pos_editor() : self.set.poly_editor();
    };
    self.set.act = active => {
        if (active)
            dom('act')
                .addClass('active')
                .text('Выкл');
        else
            dom('act')
                .removeClass('active')
                .text('Вкл');
    };
    self.set.clear = () => {
        if (!self._map) return;
        self._map.geoObjects.removeAll();

        if (self.type === 'pos') {
            self.data.pos = '';
            self.set.pos_editor();
        }
        else {
            self.data.poly = '';
            self.set.poly_editor();
        }
        self.on_change && self.on_change();

        return false;
    };
    self.set.pos_editor = () => {
        if (!self._map) return;

        var mark;

        if (self.data.pos) {
            mark = new ymaps.Placemark(self.data.pos.split(','));
            self._map.geoObjects.add(mark);
        }

        self._map.events.add("click", function(e) {
            var coord = e.get('coords');
            self.data.pos = coord.join(',');

            if (!mark) {
                mark = new ymaps.Placemark(coord);
                self._map.geoObjects.add(mark);
            }
            else mark.geometry.setCoordinates(coord);

            self.on_change && self.on_change();
        });
    };
    self.set.poly_editor = () => {
        if (!self._map) return;

        var polygon = new ymaps.Polygon([format_poly(), []], {}, {
            editorDrawingCursor: "crosshair",
            strokeColor: '#0000FF',
            strokeWidth: 3
        });

        self._map.geoObjects.add(polygon);

        if (!self.data.poly) {
            var stateMonitor = new ymaps.Monitor(polygon.editor.state);
            stateMonitor.add("drawing", new_dot => {
                polygon.options.set("strokeColor", new_dot ? '#FF0000' : '#0000FF');
                if (!new_dot) {
                    var coords = polygon.geometry.getCoordinates()[0];
                    self.data.poly = coords.join(',');

                    self.on_change && self.on_change();
                }
            });

            polygon.editor.startDrawing();
        }
    };

    function dom(id) {return $(self.dom.block+' '+self.dom[id]);}
    function format_poly() {
        if (!self.data.poly) return [];

        var poly = self.data.poly ? self.data.poly.split(',') : [];
        var formatted = [];

        for (var i = 0; i < poly.length; i += 2) {
            formatted.push([poly[i]*1, poly[i+1]*1]);
        }
        //console.log(formatted);
        return formatted;
    }

    return self;
}