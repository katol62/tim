function array_to_obj(array, key) {
    if (!Array.isArray(array) || !array[0][key]) return {};

    var obj = {};
    array.map(elem => {obj[elem[key]] = elem});

    return obj;
}

function image_path(type, id, name, size) {
    return '/uploads/'+type+'/'+id+'/'+name+(size ? '_'+size : '_small')+'.jpg';
}

$(document).ready(function() {
    $('body').on('click', '#preview-image-block', function() {
        $(this).animate({opacity: 0}, 500, () => {$(this).remove();})
    });

    /*$(document).click(function() {
        var preview = $('#preview-image-block');
        console.log(preview);
        if (preview.length) {
            preview.animate({opacity: 0}, 500, function() {preview.remove();});
            return false;
        }
    });*/
});
function photo_view(url) {
    var block = $('<div id="preview-image-block"><img class="img-thumbnail" src="'+url+'" alt=""></div>');
    $('body').append(block);
    block.animate({opacity: 1}, 300);
}