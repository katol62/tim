function Times() {
    var self = {
        dom: '#times',
        empty: true
    };

    self.init = () => {
        $(self.dom+' input').on('change', function() {self.empty = false;});
    };

    self.render = times => {
        if (!times || !times.length) {
            $(self.dom+' .from').val('00:00:00');
            $(self.dom+' .to').val('23:58:00');
            self.empty = true;
            return;
        }

        var days = JSON.parse(times);
        $.each(days, setday);
        self.empty = false;
    };

    self.values = () => {
        if (self.empty) return null;

        var values = [];
        var days = $(self.dom+' .row');
        $.each(days, (num, day) => {
            values.push([
                $(day).find('.from').val(),
                $(day).find('.to').val()
            ]);
        });

        return JSON.stringify(values);
    };

    function setday(num, day) {
        if (!day) return;
        $(self.dom+' input[name="times['+num+'][from]"]').val(day[0]);
        $(self.dom+' input[name="times['+num+'][to]"]').val(day[1]);
    }

    return self;
}