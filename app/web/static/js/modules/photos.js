var ImageEditor = function(settings) {
    var self = this,
        options = $.extend({
            editable: false,
            top: 200,
            left: 100,
            width: 600,
            height: 200,
            imageUrl: '',
            imageId: '',
            type: '',
            title: '',
            modal: '#image_editor',
            onRefresh: undefined,
            onDelete: undefined,
            onSave: (props) => {}
        }, settings);

    self.init = (title, imageUrl, id, type, props, onRefresh, onDelete, onSave) => {
        options.imageUrl = imageUrl;
        options.imageId = id;
        options.type = type;
        options.title = title;
        $(options.modal+' .modal-title').html(options.title);
        $(options.modal+' .image-frame img').attr('src', options.imageUrl);
        options.onRefresh = onRefresh;
        options.onDelete = onDelete;
        options.onSave = onSave;
        if (props && props.length) {
            options.top = props[2];
            options.left = props[3];
            options.width = props[0];
            options.height = props[1];
        }
        $(options.modal+' .frame').css({
            top: options.top+'px',
            left: options.left+'px',
            width: options.width+'px',
            height: options.height+'px'
        });

        $(options.modal).modal('show');
    };

    $('body').on('mousemove', options.modal+' .frame-block', function(e) {
        if (!options.editable) return;

        var offset = $(this).offset(),
            top = e.pageY - offset.top - 100,
            left = e.pageX - offset.left - 300;

        top = 0 > top ? 0 : top;
        options.top = 400 < top ? 400 : top;
        left = 0 > left ? 0 : left;
        options.left = 200 < left ? 200 : left;

        $(options.modal+' .frame').css({
            top: options.top+'px',
            left: options.left+'px'
        });
    });
    $('body').on('click', options.modal+' .frame', () => {options.editable = false;});
    $('body').on('mousedown', options.modal+' .frame', e => {options.editable = !$(e.target).hasClass('ui-resizable-handle');});
    $('body').on('mouseup', options.modal+' .frame', () => {options.editable = false;});
    $(options.modal+' .frame').resizable({
        aspectRatio: 600 / 200,
        maxWidth: 600,
        minWidth: 200,
        stop: (event, ui) => {
            options.width = ui.size.width;
            options.height = ui.size.height;
        }
    });

    $('body').on('click', options.modal+' .refresh', () => {
        //options.onRefresh && options.onRefresh();
        return false;
    });

    $('body').on('click', options.modal+' .del', () => {
        if (!confirm('Вы уверены, что хотите удалить изображение?')) return false;

        $.ajax({
            url: '/photos/delete',
            type: "POST",
            async: true,
            data: {
                id: options.imageId,
                type: options.type
            },
            success: res => {
                options.onDelete && options.onDelete(options.imageId);
                $(options.modal).modal('hide');
            }
        });

        return false;
    });

    $('body').on('click', options.modal+' .save', () => {
        $.ajax({
            url: "/photos/frame_edit",
            type: "POST",
            async: true,
            cache: false,
            data: {
                type: options.type,
                id: options.imageId,
                top: options.top,
                left: options.left,
                width: options.width,
                height: options.height
            },
            success: function() {
                refreshImg();
                $(options.modal).modal('hide');
                options.onSave && options.onSave([options.width, options.height, options.top, options.left]);
            }
        });

        return false;
    });
};

function refreshImg() {
    $('img').each(function() {
        var src = $(this).attr('src').split("?");
        if (src[0].length && -1 == src[0].indexOf("http://")) {
            $(this).attr('src', src[0]+'?rand='+Math.random());
        }
    });
}