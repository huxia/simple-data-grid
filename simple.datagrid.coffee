###
Copyright 2012 Marco Braak

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
###

$ = @jQuery

SimpleWidget = @SimpleWidget


min = (value1, value2) ->
    if value1 < value2
        return value1
    else
        return value2

max = (value1, value2) ->
    if value1 > value2
        return value1
    else
        return value2

range = (start, stop) ->
    len = stop - start
    array = new Array(len)

    i = 0
    while i < len
        array[i] = start
        start += 1
        i += 1

    return array


class SimpleDataGrid extends SimpleWidget
    defaults:
        order_by: null
        url: null
        data: null
        paginator: null
        on_generate_tr: null
        on_generate_footer: null

    loadData: (data) ->
        @_fillGrid(data)

    getColumns: ->
        return @columns

    getSelectedRow: ->
        if @$selected_row
            return @$selected_row.data('row')
        else
            return null

    reload: ->
        @_loadData()

    setParameter: (key, value) ->
        @parameters[key] = value

    setCurrentPage: (page) ->
        @current_page = page

    addColumn: (column, index) ->
        column_info = @_createColumnInfo(column)

        if index?
            @columns.splice(index, 0, column_info)
        else
            @columns.push(column_info)
 
        return column_info

    removeColumn: (column_key) ->
        getColumnIndex = =>
            for column, i in @columns
                if column.key == column_key
                    return i

            return null

        column_index = getColumnIndex()
        if column_index != null
            @columns.splice(column_index, 1)

    url: (value) ->
        if value
            @_url = value

        return @_url            

    _init: ->
        super()

        @_url = @_getBaseUrl()
        @$selected_row = null
        @current_page = 1
        @parameters = {}
        @order_by = @_parseOrderByOption()
        @sort_order = @_parseSortorderOption() or SortOrder.ASCENDING

        @_generateColumnData()
        @_createDomElements()
        @_bindEvents()
        @_loadData()

    _deinit: ->
        @_removeDomElements()
        @_removeEvents()

        @columns = []
        @options = {}
        @parameters = {}
        @order_by = null
        @sort_order = null
        @$selected_row = null
        @current_page = 1
        @_url = null

        super()

    _getBaseUrl: ->
        url = @options.url
        if url
            return url
        else
            return @$el.data('url')

    _generateColumnData: ->
        column_map = {}

        addColumn = (info) =>
            @columns.push(info)
            column_map[info.key] = info

        generateFromThElements = =>
            $th_elements = @$el.find('th')
            $th_elements.each(
                (i, th) =>
                    $th = $(th)

                    title = $th.text()
                    key = $th.data('key') or slugify(title)

                    addColumn(title: title, key: key)
            )

        generateFromOptions = =>
            for column in @options.columns
                column_info = null
                if typeof column == 'object'
                    if 'key' of column
                        key = column.key
                        if typeof key == 'string'
                            column_info = column_map[key]
                        else
                            column_info = @columns[key]

                if column_info
                    @_updateColumnInfo(column_info, column)
                else
                    column_info = @_createColumnInfo(column)
                    if column_info
                        addColumn(column_info)

            return null

        @columns = []
        generateFromThElements()
        if @options.columns
            generateFromOptions()

    _createColumnInfo: (column) ->
        if typeof column == 'object'
            if not (column.title or column.key)
                return null
            else
                return {
                    title: column.title
                    key: column.key or slugify(column.title)
                    on_generate: column.on_generate
                }
        else
            return {
                title: column
                key: slugify(column)
            }

    _updateColumnInfo: (column_info, column) ->
        if column.title
            column_info.title = column.title

        if column.on_generate
            column_info.on_generate = column.on_generate

    _parseOrderByOption: ->
        order_by_from_options = @options.order_by
        order_by_from_data = @$el.data('order-by')

        order_by = not not (order_by_from_options or order_by_from_data)

        if typeof order_by_from_data == 'string'
            order_by = order_by_from_data

        if typeof order_by_from_options == 'string'
            order_by = order_by_from_options

        return order_by

    _parseSortorderOption: ->
        sortorder_from_options = @options.sortorder
        sortorder_from_data = @$el.data('sortorder')

        sortorder = sortorder_from_options or sortorder_from_data

        if sortorder == 'asc'
            return SortOrder.ASCENDING
        else if sortorder == 'desc'
            return SortOrder.DESCENDING            
        else
            return false

    _createDomElements: ->
        initTable = =>
            @$el.addClass('simple-data-grid')

        initBody = =>
            @$tbody = @$el.find('tbody')

            if @$tbody.length
                @$tbody.empty()
            else
                @$tbody = $('<tbody></tbody>')
                @$el.append(@$tbody)

        initFoot = =>
            @$tfoot = @$el.find('tfoot')

            if @$tfoot.length
                @$tfoot.empty()
            else
                @$tfoot = $('<tfoot></tfoot>')
                @$el.append(@$tfoot)

        initHead = =>
            @$thead = @$el.find('thead')

            if @$thead.length
                @$thead.empty()
            else
                @$thead = $('<thead></thead>')
                @$el.append(@$thead)

        initTable()
        initHead()
        initBody()
        initFoot()

    _removeDomElements: ->
        @$el.removeClass('simple-data-grid')
        if @$tbody
            @$tbody.remove()

        @$tbody = null

    _bindEvents: ->
        @$el.delegate('tbody tr', 'click', $.proxy(@_clickRow, this))
        @$el.delegate('thead tr.sorted', 'click', $.proxy(@_clickHeader, this))
        @$el.delegate('.pagination a', 'click', $.proxy(@_handleClickPage, this))

    _removeEvents: ->
        @$el.undelegate('tbody tr', 'click')
        @$el.undelegate('tbody thead th a', 'click')
        @$el.undelegate('.pagination a', 'click')

    _loadData: ->
        query_parameters = $.extend({}, @parameters, {page: @current_page})

        order_by = @_getOrderByColumn()
        if order_by
            query_parameters.order_by = order_by

            if @sort_order == SortOrder.DESCENDING
                query_parameters.sortorder = 'desc'
            else
                query_parameters.sortorder = 'asc'

        getDataFromUrl = =>
            @$el.addClass('loading')

            $.ajax(
                url: @_url
                data: query_parameters
                success: (response) =>
                    @$el.removeClass('loading')

                    if $.isArray(response) or typeof response == 'object' or not response?
                        result = response
                    else
                        result = $.parseJSON(response)

                    @_fillGrid(result)
                cache: false
                type: 'GET'
                dataType: 'json'
            )

        getDataFromArray = =>
            @_fillGrid(@options.data)

        if @_url
            getDataFromUrl()
        else if @options.data
            getDataFromArray()
        else
            @_fillGrid([])

    _fillGrid: (data) ->
        addRowFromObject = (row) =>
            html = ''
            for column in @columns
                if column.key of row
                    value = row[column.key]

                    if column.on_generate
                        value = column.on_generate(value, row)
                else
                    if column.on_generate
                        value = column.on_generate('', row)
                    else
                        value = ''

                html += "<td class=\"column_#{ column.key }\">#{ value }</td>"

            return html

        addRowFromArray = (row) =>
            html = ''

            for column, i in @columns
                if i < row.length
                    value = row[i]
                else
                    value = ''

                if column.on_generate
                    value = column.on_generate(value, row)

                html += "<td class=\"column_#{ column.key }\">#{ value }</td>"

            return html

        generateTr = (row) =>
            if row.id
                data_string = " data-id=\"#{ row.id }\""
            else
                data_string = ""

            return "<tr#{ data_string }>"

        fillRows = (rows) =>
            @$tbody.empty()

            for row in rows
                html = generateTr(row)

                if $.isArray(row)
                    html += addRowFromArray(row)
                else
                    html += addRowFromObject(row)

                html += '</tr>'
                $tr = $(html)
                $tr.data('row', row)

                if @options.on_generate_tr
                    @options.on_generate_tr($tr, row)

                @$tbody.append($tr)
            return null

        fillFooter = (total_pages, row_count) =>
            if not total_pages or total_pages == 1
                if row_count == 0
                    html = "<tr><td colspan=\"#{ @columns.length }\">No rows</td></tr>"
                else
                    html = ''
            else
                html = "<tr><td class=\"pagination\" colspan=\"#{ @columns.length }\">"
                html += fillPaginator(@current_page, total_pages)
                html += "</td></tr>"

            @$tfoot.html(html)

            if @options.on_generate_footer
                @options.on_generate_footer(@$tfoot, this, data)

        fillPaginator = (current_page, total_pages) =>
            html = '<ul>'
            pages = @_getPages(current_page, total_pages)

            if current_page > 1
                html += "<li><a href=\"#\" data-page=\"#{current_page - 1}\">&lsaquo;&lsaquo;&nbsp;previous</a></li>"
            else
                html += "<li class=\"disabled\"><a href=\"#\">&lsaquo;&lsaquo;&nbsp;previous</a></li>"

            for page in pages
                if not page
                    html += '<li><span>...</span></li>'
                else
                    if page == current_page
                        html += "<li class=\"active\"><a>#{ page }</a></li>"
                    else
                        html += "<li><a href=\"#\" data-page=\"#{ page }\">#{ page }</a></li>"

            if current_page < total_pages
                html += "<li><a href=\"#\" data-page=\"#{ current_page + 1 }\">next&nbsp;&rsaquo;&rsaquo;</a></li>"
            else
                html += "<li class=\"disabled\"><a>next&nbsp;&rsaquo;&rsaquo;</a></li>"

            html += '</ul>'
            return html

        fillHeader = (row_count) =>
            order_by = @_getOrderByColumn()
            is_sorted = order_by and (row_count != 0)

            if is_sorted
                html = '<tr class="sorted">'
            else
                html = '<tr>'

            for column in @columns
                html += "<th data-key=\"#{ column.key }\" class=\"column_#{ column.key }\">"

                if not is_sorted
                    html += column.title
                else
                    html += "<a href=\"#\">#{ column.title }"

                    if column.key == order_by
                        class_html = "sort "
                        if @sort_order == SortOrder.DESCENDING
                            class_html += "asc sprite-icons-down"
                            sort_text = '&#x25b2;'
                        else
                            class_html += "desc sprite-icons-up"
                            sort_text = '&#x25bc;'
                        html += "<span class=\"#{ class_html }\">#{ sort_text }</span>"

                    html += "</a>"

                html += "</th>"

            html += '</tr>'
            @$thead.html(html)

        if $.isArray(data)
            rows = data
            total_pages = 0
        else if data and data.rows
            rows = data.rows
            total_pages = data.total_pages or 0
        else
            rows = []

        @total_pages = total_pages

        fillRows(rows)
        fillFooter(total_pages, rows.length)
        fillHeader(rows.length)

        event = $.Event('datagrid.load_data')
        @$el.trigger(event)

    _clickRow: (e) ->
        if @$selected_row
            @$selected_row.removeClass('selected')

        $tr = $(e.target).closest('tr')
        $tr.addClass('selected')
        @$selected_row = $tr

        event = $.Event('datagrid.select')
        event.row = $tr.data('row')
        event.$row = $tr
        @$el.trigger(event)

    _handleClickPage: (e) ->
        page = $(e.target).data('page')

        if page
            @_gotoPage(page)
            return false
        else
            return true

    _gotoPage: (page) ->
        if page <= @total_pages
            @current_page = page
            @_loadData()

    _clickHeader: (e) ->
        $th = $(e.target).closest('th')

        if $th.length
            key = $th.data('key')

            if key == @_getOrderByColumn()
                if @sort_order == SortOrder.ASCENDING
                    @sort_order = SortOrder.DESCENDING
                else
                    @sort_order = SortOrder.ASCENDING
            else
                @sort_order = SortOrder.ASCENDING

            @order_by = key
            @current_page = 1
            @_loadData()

        return false

    _getPages: (current_page, total_pages) ->
        page_window = @_getPageWindow()

        first_end = min(page_window, total_pages)
        last_start = max(1, (total_pages - page_window) + 1)

        current_start = max(1, current_page - page_window)
        current_end = min(total_pages, current_page + page_window)

        if first_end >= current_start
            current_start = 1
            first_range = []
        else
            first_range = range(1, first_end + 1)

        if current_end >= last_start
            current_end = total_pages
            last_range = []
        else
            last_range = range(last_start, total_pages + 1)

        current_range = range(current_start, current_end + 1)

        first_gap = current_start - first_end
        if first_gap == 2
            first_range.push(first_end + 1)
        else if first_gap > 2
            first_range.push(0)

        last_gap = last_start - current_end
        if last_gap == 2
            current_range.push(current_end + 1)
        else if last_gap > 2
            current_range.push(0)

        return first_range.concat(current_range, last_range)

    testGetPages: (current_page, total_pages) ->
        return @_getPages(current_page, total_pages)

    _getPageWindow: ->
        if @options.paginator and @options.paginator.page_window
            return @options.paginator.page_window
        else
            return 4

    _getOrderByColumn: ->
        if not @order_by
            return null
        else if @order_by != true
            return @order_by
        else if @columns.length
            return @columns[0].key
        else
            return null

SimpleWidget.register(SimpleDataGrid, 'simple_datagrid')


slugify = (string) ->
    return string.replace(/[-\s]+/g, '_').replace(/[^a-zA-Z0-9\_]/g, '').toLowerCase()

parseQueryParameters = (query_string) ->
    query_parameters = {}
    parameter_strings = query_string.toString().split(/[&;]/)

    for p in parameter_strings
        if p != ""
            keyval = p.split('=')
            key = keyval[0]
            value = keyval[1].replace('+', ' ')
            query_parameters[key] = value

    return query_parameters

parseUrl = (url) ->
    url_parts = url.split('?')

    if url_parts.length == 1
        return [url, {}]
    else
        [base_url, query_string] = url_parts
        query_parameters = parseQueryParameters(query_string)
        return [base_url, query_parameters]


@SimpleDataGrid = SimpleDataGrid
SimpleDataGrid.slugify = slugify

SortOrder =
    ASCENDING: 1
    DESCENDING: 2
