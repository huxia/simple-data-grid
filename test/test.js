$(function() {

function formatValues($elements) {
    var values = $elements.map(function() {
        return $(this).text();
    });
    return values.toArray().join(';');
}

function getRowValues($table) {
    return formatValues(
        $table.find('tbody td')
    );
}

function formatColumnNames($table) {
    var columns = $table.simple_datagrid('getColumns');
    var values = $.map(columns, function(column) {
        return column.key;
    });
    return values.join(';');
}

module('utils');

test('slugify', function() {
    slugify = SimpleDataGrid.slugify;

    equal(slugify(''), '');
    equal(slugify('abc'), 'abc');
    equal(slugify('Abc'), 'abc');
    equal(slugify('abc def'), 'abc_def');
    equal(slugify('123'), '123');
    equal(slugify('abc-def'), 'abc_def');
    equal(slugify('abc_def'), 'abc_def');
});

test('buildUrl', function() {
    buildUrl = SimpleDataGrid.buildUrl;

    equal(buildUrl('abc'), 'abc');
    equal(buildUrl('abc', {x: '1', y: '2'}), 'abc?x=1&y=2');  // params x and y
    equal(buildUrl('/abc/?x=1&y=2', {x: '3', z: '4'}), '/abc/?x=3&y=2&z=4');  // override parameter x
    equal(buildUrl('/abc/?', {x: '1'}), '/abc/?x=1');  // querystring is '?'
});

module('simple-data-grid', {
    setup: function(e) {
        $('body').append(
            '<table id="table1">'+
            '  <thead>'+
            '    <th>Name</th>'+
            '    <th>Latin name</th>'+
            '  </thead>'+
            '</table>'
        );
    },

    teardown: function() {
        var $table1 = $('#table1');
        $table1.simple_datagrid('destroy');
        $table1.remove();

        $.mockjaxClear();
    }
});

test('get column data from <th> elements', function() {
    var $table1 = $('#table1');

    // Change the key of the first column to 'name1' by setting the 'data-key' property
    var $name_th = $table1.find('th:first');
    $name_th.attr('data-key', 'name1');

    // init widget
    $table1.simple_datagrid();

    // check column data
    var columns = $('#table1').simple_datagrid('getColumns');
    equal(columns.length, 2);
    equal(columns[0].title, 'Name');
    equal(columns[0].key, 'name1');  // from data-key
    equal(columns[1].title, 'Latin name');
    equal(columns[1].key, 'latin_name');  // slug of 'Latin name'
});

test('get column data from options', function() {
    // setup
    var $table1 = $('#table1');

    // 1. Init columns in javascript; this updates the existing columns
    $table1.simple_datagrid({
        columns: [
            {
                key: 'latin_name',
                title: 'Latin'
            }
        ]
    });

    var columns = $table1.simple_datagrid('getColumns');
    equal(columns.length, 2);
    equal(columns[1].key, 'latin_name');
    equal(columns[1].title, 'Latin');

    $table1.simple_datagrid('destroy');

    // 2. Init columns in javascript; first remove thead
    $table1.find('thead').remove();

    $table1.simple_datagrid({
        columns: [
            'Column1',
            {
                title: 'Column2',
                key: 'c2'
            },
            {
                title: 'Column3'
            }
        ]
    });

    // check column data
    columns = $('#table1').simple_datagrid('getColumns');
    equal(columns.length, 3);
    equal(columns[0].title, 'Column1');
    equal(columns[0].key, 'column1');  // slug of name
    equal(columns[1].title, 'Column2');
    equal(columns[1].key, 'c2');   // defined in options
    equal(columns[2].key, 'column3');
    equal(columns[2].title, 'Column3');
});

test('get data from array', function() {
    var $table1 = $('#table1');

    // 1. row is an array
    $table1.simple_datagrid({
        data: [
            ['Avocado', 'Persea americana']
        ]
    });
    equal(getRowValues($table1), 'Avocado;Persea americana');

    // 2. make empty
    $table1.simple_datagrid('loadData', []);
    equal(getRowValues($table1), '');

    // 3. row is an object
    $table1.simple_datagrid(
        'loadData',
        [
            {
                name: "Bell pepper",
                'latin_name': "Capsicum annuum"
            },
            {
                name: 'Tomatillo'  // no latin-name
            }
        ]
    );
    equal(getRowValues($table1), 'Bell pepper;Capsicum annuum;Tomatillo;');

    // 4. invalid data
    $table1.simple_datagrid('loadData', '');
});

test('get data from ajax', function() {
    // setup
    var $table1 = $('#table1');
    $table1.attr('data-url', '/api/fruits/');

    $.mockjax({
        url: '*',
        responseText: '[["Winter melon", "Benincasa hispida"]]'
    });

    $table1.bind(
        'datagrid.load_data', function() {
            start();
            equal(
                getRowValues($table1),
                'Winter melon;Benincasa hispida'
            );
        }
    );

    // -- init table
    $table1.simple_datagrid();
    stop();
});

test('get data from ajax; define url in options', function() {
    // setup
    var $table1 = $('#table1');

    $.mockjax({
        url: '*',
        responseText: [
            ["Cucumber", "Cucumis sativus"]
        ]
    });

    $table1.bind(
        'datagrid.load_data', function() {
            start();

            equal(
                getRowValues($table1),
                'Cucumber;Cucumis sativus'
            );
        }
    );

    // -- init table
    $table1.simple_datagrid({
        url: '/api/fruits/'
    });
    stop();
});

test('getSelectedRow', function() {
    // setup
    var $table1 = $('#table1');
    $table1.simple_datagrid({
        data: [
            {
                name: 'Avocado',
                'latin_name': 'Persea americana',
                id: 200
            },
            {
                name: 'Bell pepper',
                'latin_name': 'Capsicum annuum',
                id: 201
            }
        ]
    });

    // 1. no selection
    equal($table1.simple_datagrid('getSelectedRow'), null);

    // 2. select second row
    $table1.find('tbody tr:eq(1) td:first').click();
    ok($('tbody tr:eq(1)').hasClass('selected'));
    equal($table1.simple_datagrid('getSelectedRow').id, 201);

    // 2. select first row
    $table1.find('tbody tr:eq(0) td:first').click();
    ok($('tbody tr:eq(0)').hasClass('selected'));
    ok(! $('tbody tr:eq(1)').hasClass('selected'));
    equal($table1.simple_datagrid('getSelectedRow').id, 200);
});

test('header html', function() {
    // setup
    var $table1 = $('#table1');
    $table1.simple_datagrid();

    // 1. check html
    equal(
        formatValues($table1.find('thead th')),
        'Name;Latin name'
    );

    var keys = $table1.find('thead th').map(function() {
        return $(this).data('key');
    });
    equal(keys.toArray().join(' '), 'name latin_name');
});

test('pagination', function() {
    // todo: look for better definition of the test

    // setup
    function getResponse(settings) {
        var uri = new Uri(settings.url);
        var page = uri.getQueryParamValue('page') || 1;

        var total_pages = 100;
        var rows_per_page = 5;

        var rows = [];
        var index = (page - 1) * rows_per_page + 1;
        for (var i=0; i<rows_per_page; i++) {
            rows.push({
                name: 'n' + index,
                'latin_name': 'l' + index
            });
            index += 1;
        }

        this.responseText = {
            total_pages: total_pages,
            rows: rows
        };
    }

    $.mockjax({
        url: '*',
        response: getResponse
    });

    var $table1 = $('#table1');

    // -- init table    
    $table1.simple_datagrid({ url: '/my_data/' });

    function runSteps($table, steps) {
        stop();

        var load_count = 0;

        $table1.bind(
            'datagrid.load_data',
            function() {
                var step_function = steps[load_count];
                step_function();

                load_count += 1;

                if (load_count == steps.length) {
                    start();
                }
            }
        );
    }

    runSteps(
        $table1,
        [
            function() {
                // step 1: expect first page
                equal(
                    formatValues($table1.find('tbody td')),
                    'n1;l1;n2;l2;n3;l3;n4;l4;n5;l5'
                );

                // go to next page
                $table1.find('.pagination a:last').click();
            },
            function() {
                // step 2: expect second page
                equal(
                    getRowValues($table1),
                    'n6;l6;n7;l7;n8;l8;n9;l9;n10;l10'
                );

                // go to last page
                $table1.find('.pagination a:eq(10)').click();
            },
            function() {
                // expect last page
                equal(
                    getRowValues($('#table1')),
                    'n496;l496;n497;l497;n498;l498;n499;l499;n500;l500'
                );
            }
        ]
    );
});

test('sorting', function() {
    function getResponse(settings) {
        var uri = new Uri(settings.url);
        var page = uri.getQueryParamValue('page') || 1;
        var order_by = uri.getQueryParamValue('order_by');
        var sortorder = uri.getQueryParamValue('sortorder');

        var data = [];

        if (order_by == 'name') {
            if (sortorder == 'asc') {
                data = [
                    ['Avocado', 'Persea americana'],
                    ['Bell pepper', 'Capsicum annuum'],
                    ['Eggplant', 'Solanum melongena']
                ];
            }
            else if (sortorder == 'desc') {
                data = [
                    ['Eggplant', 'Solanum melongena'],
                    ['Bell pepper', 'Capsicum annuum'],
                    ['Avocado', 'Persea americana']
                ];
            }
        }
        else if (order_by == 'latin_name') {
            if (sortorder == 'asc') {
                data = [
                    ['Bell pepper', 'Capsicum annuum'],
                    ['Avocado', 'Persea americana'],
                    ['Eggplant', 'Solanum melongena']
                ];
            }
            else if (sortorder == 'desc') {
                data = [
                    ['Eggplant', 'Solanum melongena'],
                    ['Avocado', 'Persea americana'],
                    ['Bell pepper', 'Capsicum annuum']
                ];
            }
        }

        this.responseText = data;
    }

    var $table1 = $('#table1');

    function format_first_columns() {
        var values = $table1.find('tbody tr').map(
            function() {
                return $(this).find('td:eq(0)').text();
            }
        );

        return values.toArray().join(';');
    }

    $.mockjax({
        url: '*',
        response: getResponse
    });

    var load_count = 0;

    $table1.bind(
        'datagrid.load_data',
        function() {
            if (load_count == 0) {
                equal(format_first_columns(), 'Avocado;Bell pepper;Eggplant');

                // -- click on 'name' -> sort descending
                $table1.find('th:eq(0) a').click();
            }
            else if (load_count == 1) {
                equal(format_first_columns(), 'Eggplant;Bell pepper;Avocado');

                // -- click on 'latin-name' -> sort ascending
                $table1.find('th:eq(1) a').click();
            }
            else if (load_count == 2) {
                equal(format_first_columns(), 'Bell pepper;Avocado;Eggplant');

                // -- click on 'latin-name' -> sort descending
                $table1.find('th:eq(1) a').click();
            }
            else if (load_count == 3) {
                equal(format_first_columns(), 'Eggplant;Avocado;Bell pepper');

                // -- click on 'latin-name' -> sort ascending
                $table1.find('th:eq(1) a').click();
            }
            else {
                start();
            }

            load_count += 1;
        }
    );

    // -- init tree; order by name
    $table1.simple_datagrid({
        url: '/fruits/',
        order_by: 'name'
    });
    stop();
});

test('reload', function() {
    // setup
    var $table1 = $('#table1');
    $table1.simple_datagrid({
        data: [
            ['Avocado', 'Persea americana']
        ]
    });

    equal(getRowValues($table1), 'Avocado;Persea americana');

    // 1. empty html
    $table1.find('tbody tr').detach();
    equal(getRowValues($table1), '');

    // 2. reload
    $table1.simple_datagrid('reload');
    equal(getRowValues($table1), 'Avocado;Persea americana');
});

test('setParameter', function() {
    // setup
    stop();

    var response_count = 0;

    function getResponse(settings) {
        var uri = new Uri(settings.url);
        var my_param = uri.getQueryParamValue('my_param');

        if (response_count == 0) {
            equal(my_param, undefined);
        }
        else if (response_count == 1) {
            equal(my_param, 'abc');
        }

        response_count += 1;

        this.responseText = [
            ['Avocado', 'Persea americana']
        ];
    }
    
    $.mockjax({
        url: '*',
        response: getResponse
    });

    var $table1 = $('#table1');

    var load_count = 0

    $table1.bind(
        'datagrid.load_data',
        function() {
            if (load_count == 0) {
                // -- set parameter and reload
                $table1.simple_datagrid('setParameter', 'my_param', 'abc');
                $table1.simple_datagrid('reload');
            }
            else if (load_count == 1) {
                start();
            }

            load_count += 1;
        }
    );

    $table1.simple_datagrid({
        url: '/fruits/'
    });
});

test('setCurrentPage', function() {
    // setup
    stop();

    var response_count = 0;

    function getResponse(settings) {
        var uri = new Uri(settings.url);
        var page = uri.getQueryParamValue('page');

        if (response_count == 0) {
            equal(page, 1);
        }
        else if (response_count == 1) {
            equal(page, 2);
        }

        response_count += 1;

        this.responseText = [
            ['Avocado', 'Persea americana']
        ];
    }

    $.mockjax({
        url: '*',
        response: getResponse
    });

    var $table1 = $('#table1');

    var load_count = 0

    $table1.bind(
        'datagrid.load_data',
        function() {
            if (load_count == 0) {
                // -- set current page and reload
                $table1.simple_datagrid('setCurrentPage', 2);
                $table1.simple_datagrid('reload');
            }
            else if (load_count == 1) {
                start();
            }

            load_count += 1;
        }
    );

    $table1.simple_datagrid({ url: '/fruits/' });
});

test('table with existing elements', function() {
    // Test with a table that already has rows and a footer.
    // The existing elements must be overwritten.

    // setup
    var $table1 = $('#table1');
    $table1.append('<tbody><tr><td>abc</td></tr></tbody');
    $table1.append('<tfoot><tr><td>my footer</td></tfoot>');

    // 1. init table
    $table1.simple_datagrid({
        data: [
            ['Avocado', 'Persea americana']
        ]
    });

    equal(getRowValues($table1), 'Avocado;Persea americana');
    equal($table1.find('tfoot').text(), '');
});

test('table with empty head', function() {
    // setup
    var $table1 = $('#table1');
    $table1.find('thead').remove();

    // 1. init table
    $table1.simple_datagrid({
        columns: ['Column1'],
        data: [['abc']]
    });

    equal(
        $table1.find('thead th').text(),
        'Column1'
    );
});

test('on_generate', function() {
    // Test the 'on_generate' option of a column
    var $table1 = $('#table1');
    $table1.find('thead').remove();

    // 1. init table
    $table1.simple_datagrid({
        columns: [
            {
                title: 'Fruit',
                on_generate: function(value, row) {
                    return '_' + value + '_';
                }
            },
            {
                title: 'Latin name',
                on_generate: function(value, row) {
                    if (! value) {
                        return '[empty]';
                    }
                    else {
                        return value;
                    }
                }
            }
        ],
        data: [
            ['Avocado']
        ]
    });

    equal(getRowValues($table1), '_Avocado_;[empty]');

    // 2. load data; record is object
    $table1.simple_datagrid(
        'loadData',
        [
            {fruit: 'Tomato'}
        ]
    );

    equal(getRowValues($table1), '_Tomato_;[empty]');

    // 3. load data; record is array
    $table1.simple_datagrid(
        'loadData',
        [
            ['Sweet pepper']
        ]
    );


    equal(getRowValues($table1), '_Sweet pepper_;[empty]');
});

test('getPages', function() {
    // setup
    var $table1 = $('#table1');
    $table1.simple_datagrid({
        paginator: {
            page_window: 2
        }
    });

    function getPages(current_page, total_pages) {
        return $table1.simple_datagrid('testGetPages', current_page, total_pages, 2);
    }

    // 1. get pages
    deepEqual(getPages(1, 1), [1]);
    deepEqual(getPages(1, 2), [1, 2]);
    deepEqual(getPages(1, 100), [1, 2, 3, 0, 99, 100]);
    deepEqual(getPages(100, 100), [1, 2, 0, 98, 99, 100]);
    deepEqual(getPages(50, 100), [1, 2, 0, 48, 49, 50, 51, 52, 0, 99, 100]);
    deepEqual(getPages(5, 100), [1, 2, 3, 4, 5, 6, 7, 0, 99, 100]);
    deepEqual(getPages(6, 100), [1, 2, 3, 4, 5, 6, 7, 8, 0, 99, 100]);
    deepEqual(getPages(7, 100), [1, 2, 0, 5, 6, 7, 8, 9, 0, 99, 100]);
    deepEqual(getPages(96, 100), [1, 2, 0, 94, 95, 96, 97, 98, 99, 100]);
    deepEqual(getPages(95, 100), [1, 2, 0, 93, 94, 95, 96, 97, 98, 99, 100]);
    deepEqual(getPages(94, 100), [1, 2, 0, 92, 93, 94, 95, 96, 0, 99, 100]);
});

test('addColumn', function() {
    // setup
    var $table1 = $('#table1');
    $table1.simple_datagrid();

    // check initial columns
    equal(formatColumnNames($table1), 'name;latin_name');

    // 1. add column at the end
    $table1.simple_datagrid('addColumn', 'col end');
    equal(formatColumnNames($table1), 'name;latin_name;col_end');

    // 2. add column after 'name'
    $table1.simple_datagrid('addColumn', 'col2', 1);
    equal(formatColumnNames($table1), 'name;col2;latin_name;col_end');

    // 2. add column at beginning
    $table1.simple_datagrid('addColumn', 'col1', 0);
    equal(formatColumnNames($table1), 'col1;name;col2;latin_name;col_end');
});

test('removeColumn', function() {
    // setup
    var $table1 = $('#table1');
    $table1.simple_datagrid();

    // -- remove column
    $table1.simple_datagrid('removeColumn', 'name');

    equal(formatColumnNames($table1), 'latin_name');
});

});
