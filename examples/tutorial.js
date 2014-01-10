$(function() {
    $.mockjax({
        url: '*',
        response: ExampleData.handleMockjaxResponse,
        responseTime: 0
    });

    $('#demo-table').simple_datagrid({
        order_by: true
    });
});