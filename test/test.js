$(function() {

function formatValues($elements) {
	var values = $elements.map(function() {
		return $(this).text();
	});
	return values.toArray().join(';');
}

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

test('get data from array', function() {
	var $table1 = $('#table1');

	function getRowValues() {
		return formatValues(
			$table1.find('tbody td')
		);
	}

	// 1. row is an array
	$table1.simple_datagrid({
		data: [
			['Avocado', 'Persea americana']
		]
	});
	equal(getRowValues(), 'Avocado;Persea americana');

	// 2. make empty
	$table1.simple_datagrid('loadData', []);
	equal(getRowValues(), '');

	// 3. row is an object
	$table1.simple_datagrid(
		'loadData',
		[
			{
				name: "Bell pepper",
				'latin-name': "Capsicum annuum"
			}
		]
	);
	equal(getRowValues(), 'Bell pepper;Capsicum annuum');
});

test('get data from callback', function() {
	// setup
	var $table1 = $('#table1');

	function get_data(parameters, on_success) {
		on_success(
			[
				['Avocado', 'Persea americana']
			]
		);
	}

	// 1. get data from callback
	$table1.simple_datagrid({
		on_get_data: get_data
	});

	equal(
		formatValues($table1.find('tbody td')),
		'Avocado;Persea americana'
	);
});

test('getSelectedRow', function() {
	// setup
	var $table1 = $('#table1');
	$table1.simple_datagrid({
		data: [
			{
				name: 'Avocado',
				'latin-name': 'Persea americana',
				id: 200
			},
			{
				name: 'Bell pepper',
				'latin-name': 'Capsicum annuum',
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
	equal(keys.toArray().join(' '), 'name latin-name');
});

});
