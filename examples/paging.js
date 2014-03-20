$(function() {
    $.mockjax({
        url: '*',
        response: ExampleData.pagedReponse,
        responseTime: 0
    });

    $('#demo-table').simple_datagrid();
});
