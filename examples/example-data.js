ExampleData = {};

ExampleData.getData = function (parameters, on_success) {
	var rows_per_page = 5;
	var page = parameters.page || 1;
	var start_index = (page - 1) * rows_per_page;

	var total_pages = 1;
	var data = ExampleData.fruits
	if (data.length != 0) {
		total_pages = parseInt((data.length - 1) / rows_per_page) + 1;
	}

	if (parameters.order_by) {
		data.sort(function(left, right) {
			var a = left[parameters.order_by];
			var b = right[parameters.order_by];

			if (parameters.sortorder == 'desc') {
				var c = b;
				b = a;
				a = c;
			}

			if (a < b) {
				return -1;
			}
			else if (a > b) {
				return 1;
			}
			else {
				return 0;
			}
		});
	}

	on_success({
		total_pages: total_pages,
		rows: data.slice(start_index, start_index + rows_per_page)
	});
};

ExampleData.fruits = [{
    "latin-name": "Persea americana",
    "name": "Avocado"
},
{
    "latin-name": "Capsicum annuum",
    "name": "Bell pepper"
},
{
    "latin-name": "Momordica charantia",
    "name": "Bitter melon"
},
{
    "latin-name": "Cucurbita pepo",
    "name": "Courgette"
},
{
    "latin-name": "Cucumis sativus",
    "name": "Cucumber"
},
{
    "latin-name": "Coccinia grandis",
    "name": "Ivy Gourd"
},
{
    "latin-name": "Solanum melongena",
    "name": "Eggplant"
},
{
    "latin-name": "Cucurbita spp.",
    "name": "Pumpkin"
},
{
    "latin-name": "Zea mays",
    "name": "Sweet corn"
},
{
    "latin-name": "Capsicum annuum Grossum group",
    "name": "Sweet pepper"
},
{
    "latin-name": "Praecitrullus fistulosus",
    "name": "Tinda"
},
{
    "latin-name": "Physalis philadelphica",
    "name": "Tomatillo"
},
{
    "latin-name": "Solanum lycopersicum var",
    "name": "Tomato"
},
{
    "latin-name": "Benincasa hispida",
    "name": "Winter melon"
},
{
    "latin-name": "Cucumis anguria",
    "name": "West Indian gherkin"
},
{
    "latin-name": "Cucurbita pepo",
    "name": "Zucchini"
}];