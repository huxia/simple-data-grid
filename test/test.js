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
				'latin-name': "Capsicum annuum"
			}
		]
	);
	equal(getRowValues($table1), 'Bell pepper;Capsicum annuum');
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

test('pagination', function() {
    // setup
	function getData(parameters, on_success) {
		var total_pages = 3;
		var rows_per_page = 5;

		var rows = [];
		var index = (parameters.page - 1) * rows_per_page + 1;
		for (var i=0; i<5; i++) {
			rows.push({
				name: 'n' + index,
				'latin-name': 'l' + index
			});
			index += 1;
		}

		on_success({
			total_pages: total_pages,
			rows: rows
		});
	}

	// 1. init table
	var $table1 = $('#table1');
	$table1.simple_datagrid({
		on_get_data: getData
	});

	equal(
		formatValues($table1.find('tbody td')),
		'n1;l1;n2;l2;n3;l3;n4;l4;n5;l5'
	);

	// 2. next page
	$table1.find('.next').click();

	equal(
		formatValues($table1.find('tbody td')),
		'n6;l6;n7;l7;n8;l8;n9;l9;n10;l10'
	);
});

test('sorting', function() {
	function get_data(parameters, on_success) {
		var data = [];

		if (parameters.order_by == 'name') {
			if (parameters.sortorder == 'asc') {
				data = [
					['Avocado', 'Persea americana'],
					['Bell pepper', 'Capsicum annuum'],
					['Eggplant', 'Solanum melongena']
				];
			}
			else if (parameters.sortorder == 'desc') {
				data = [
					['Eggplant', 'Solanum melongena'],
					['Bell pepper', 'Capsicum annuum'],
					['Avocado', 'Persea americana']
				];
			}
		}
		else if (parameters.order_by == 'latin-name') {
			if (parameters.sortorder == 'asc') {
				data = [
					['Bell pepper', 'Capsicum annuum'],
					['Avocado', 'Persea americana'],
					['Eggplant', 'Solanum melongena']
				];
			}
			else if (parameters.sortorder == 'desc') {
				data = [
					['Eggplant', 'Solanum melongena'],
					['Avocado', 'Persea americana'],
					['Bell pepper', 'Capsicum annuum']
				];
			}
		}

		on_success(data);
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

	// 1. init tree; order by name
	$table1.simple_datagrid({
		on_get_data: get_data,
		order_by: 'name'
	});
	equal(format_first_columns(), 'Avocado;Bell pepper;Eggplant');

	// 2. click on 'name' -> sort descending
	$table1.find('th:eq(0) a').click();
	equal(format_first_columns(), 'Eggplant;Bell pepper;Avocado');

	// 3. click on 'latin-name; -> sort ascending
	$table1.find('th:eq(1) a').click();
	equal(format_first_columns(), 'Bell pepper;Avocado;Eggplant');

	// 4. click on 'latin-name; -> sort descending
	$table1.find('th:eq(1) a').click();
	equal(format_first_columns(), 'Eggplant;Avocado;Bell pepper');
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

	var step = 1;

	function get_data(parameters, on_success) {
		if (step == 2) {
			equal(parameters.my_param, 'abc');
		}
		step += 1;

		on_success([
			['Avocado', 'Persea americana']
		]);
		start();
	}
	
	var $table1 = $('#table1');
	$table1.simple_datagrid({
		on_get_data: get_data
	});

	// 1. set parameter and reload
	$table1.simple_datagrid('setParameter', 'my_param', 'abc');
	$table1.simple_datagrid('reload');
});

});
