$(function() {

module('utils');

test('slugify', function() {
    slugify = SimpleDataGrid.slugify;

    equal(slugify(''), '');
    equal(slugify('abc'), 'abc');
    equal(slugify('Abc'), 'abc');
    equal(slugify('abc def'), 'abc-def');
    equal(slugify('123'), '123');
    equal(slugify('abc#def'), 'abcdef');
});

test('buildUrl', function() {
    buildUrl = SimpleDataGrid.buildUrl;

    equal(buildUrl('abc'), 'abc');
    equal(buildUrl('abc', {x: '1', y: '2'}), 'abc?x=1&y=2');
});

module('simple-data-grid', {
    setup: function() {
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
        var $table1 = $('#table1')
        $table1.simple_datagrid('destroy');
        $table1.remove();
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
    equal(columns[1].key, 'latin-name');  // slug of 'Latin name'
});

test('get column data from options', function() {
    var $table1 = $('#table1');

    // init widget
    $table1.simple_datagrid({
        columns: [
            'Column1',
            {
                title: 'Column2',
                key: 'c2'
            }
        ]
    });

    // check column data
    var columns = $('#table1').simple_datagrid('getColumns');
    equal(columns.length, 2);
    equal(columns[0].title, 'Column1');
    equal(columns[0].key, 'column1');  // slug of name
    equal(columns[1].title, 'Column2');
    equal(columns[1].key, 'c2');   // defined in options
});

});
