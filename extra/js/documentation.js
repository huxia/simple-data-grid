$(function() {
    var $menu = $('#menu');
    var $body = $('body');

    $menu.affix({
        offset: {
            top: $menu.offset().top,
            bottom: 0
        }
    });

    $body.scrollspy({
        target: '#menu'
    });

    $.mockjax({
        url: '*',
        response: ExampleData.handleMockjaxResponse,
        responseTime: 0
    });

    var $table = $('#demo-table');

    $table.simple_datagrid({
        order_by: true
    });

    $table.on('datagrid.load_data', function() {
        $body.scrollspy('refresh');
    });
});
