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


class SimpleDataGrid extends SimpleWidget
    defaults:
        on_get_data: null
        order_by: null
        url: null
        data: null
        on_generate_paginator: null

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

    _init: ->
        @url = @_getBaseUrl()
        @$selected_row = null
        @current_page = 1
        @parameters = {}
        @order_by = @options.order_by
        @sort_order = SortOrder.ASCENDING

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
        @sort_order = SortOrder.ASCENDING
        @$selected_row = null
        @current_page = 1
        @url = null

    _getBaseUrl: ->
        url = @options.url
        if url
            return url
        else
            return @$el.data('url')

    _generateColumnData: ->
        generateFromThElements = =>
            $th_elements = @$el.find('th')
            @columns = []
            $th_elements.each(
                (i, th) =>
                    $th = $(th)

                    title = $th.text()
                    key = $th.data('key') or slugify(title)

                    @columns.push(
                        {title: title, key: key}
                    )
            )

        generateFromOptions = =>
            @columns = []
            for column in @options.columns
                if typeof column == 'object'
                    column_info = {
                        title: column.title,
                        key: column.key or slugify(column.title),
                        on_generate: column.on_generate
                    }
                else
                    column_info = {
                        title: column,
                        key: slugify(column)
                    }

                @columns.push(column_info)

        if @options.columns
            generateFromOptions()
        else
            generateFromThElements()

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
        @$el.delegate('tbody tr', 'click', $.proxy(this._clickRow, this))
        @$el.delegate('thead th a', 'click', $.proxy(this._clickHeader, this))
        @$el.delegate('.paginator .first', 'click', $.proxy(this._handleClickFirstPage, this))
        @$el.delegate('.paginator .previous', 'click', $.proxy(this._handleClickPreviousPage, this))
        @$el.delegate('.paginator .next', 'click', $.proxy(this._handleClickNextPage, this))
        @$el.delegate('.paginator .last', 'click', $.proxy(this._handleClickLastPage, this)
        @$el.delegate('.paginator .page', 'click', $.proxy(this._handleClickPage, this)))

    _removeEvents: ->
        @$el.undelegate('tbody tr', 'click')
        @$el.undelegate('tbody thead th a', 'click')
        @$el.undelegate('.paginator .first', 'click')
        @$el.undelegate('.paginator .previous', 'click')
        @$el.undelegate('.paginator .next', 'click')
        @$el.undelegate('.paginator .last', 'click')
        @$el.undelegate('.paginator .page', 'click')

    _loadData: ->
        query_parameters = $.extend({}, @parameters, {page: @current_page})

        if @order_by
            query_parameters.order_by = @order_by

            if @sort_order == SortOrder.DESCENDING
                query_parameters.sortorder = 'desc'
            else
                query_parameters.sortorder = 'asc'

        getDataFromCallback = =>
            @options.on_get_data(
                query_parameters,
                $.proxy(@_fillGrid, this)
            )

        getDataFromUrl = =>
            url = buildUrl(@url, query_parameters)

            $.ajax(
                url: url,
                success: (response) =>
                    if $.isArray(response)
                        result = response
                    else
                        result = $.parseJSON(response)

                    @_fillGrid(result)
                cache: false
            )

        getDataFromArray = =>
            @_fillGrid(@options.data)

        if @options.on_get_data
            getDataFromCallback()
        else if @url
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
                        value = column.on_generate(null, row)
                    else
                        value = ''

                html += "<td>#{ value }</td>"

            return html

        addRowFromArray = (row) =>
            html = ''

            for value, i in row
                column = @columns[i]

                if column.on_generate
                    value = column.on_generate(value, row)

                html += "<td>#{ value }</td>"

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
                @$tbody.append($tr)

        fillFooter = (total_pages, row_count) =>
            if not total_pages or total_pages == 1
                if row_count == 0
                    html = "<tr><td colspan=\"#{ @columns.length }\">No rows</td></tr>"
                else
                    html = ''
            else
                html = "<tr><td class=\"paginator\" colspan=\"#{ @columns.length }\">"

                if @options.on_generate_paginator
                    html += @options.on_generate_paginator(@current_page, total_pages)
                else
                    html += fillPaginator(@current_page, total_pages)

                html += "</td></tr>"

            @$tfoot.html(html)

        fillPaginator = (current_page, total_pages) =>
            html = ''

            if not @current_page or @current_page == 1
                html += '<span class="sprite-icons-first-disabled">first</span>'
                html += '<span class="sprite-icons-previous-disabled">previous</span>'
            else
                html += "<a href=\"#\" class=\"sprite-icons-first first\">first</a>"
                html += "<a href=\"#\" class=\"sprite-icons-previous previous\">previous</a>"

            html += "<span>page #{ @current_page } of #{ total_pages }</span>"

            if not @current_page or @current_page == total_pages
                html += '<span class="sprite-icons-next-disabled">next</span>'
                html += '<span class="sprite-icons-last-disabled">last</span>'
            else
                html += "<a href=\"#\" class=\"sprite-icons-next next\">next</a>"
                html += "<a href=\"#\" class=\"sprite-icons-last last\">last</a>"

            return html

        fillHeader = (row_count) =>
            html = '<tr>'
            for column in @columns
                html += "<th data-key=\"#{ column.key }\">"

                if (not @order_by) or (row_count == 0)
                    html += column.title
                else
                    html += "<a href=\"#\">#{ column.title }"

                    if column.key == @order_by
                        class_html = "sort "
                        if @sort_order == SortOrder.DESCENDING
                            class_html += "asc sprite-icons-down"
                        else
                            class_html += "desc sprite-icons-up"
                        html += "<span class=\"#{ class_html }\">sort</span>"

                    html += "</a>"

                html += "</th>"

            html += '</tr>'
            @$thead.html(html)

        if $.isArray(data)
            rows = data
            total_pages = 0
        else if data.rows
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
        @$el.trigger(event)

    _handleClickFirstPage: (e) ->
        @_gotoPage(1)
        return false

    _handleClickPreviousPage: (e) ->
        @_gotoPage(@current_page - 1)
        return false

    _handleClickNextPage: (e) ->
        @_gotoPage(@current_page + 1)
        return false

    _handleClickLastPage: (e) ->
        @_gotoPage(@total_pages)
        return false

    _handleClickPage: (e) ->
        $link = $(e.target)
        page = $link.data('page')
        @_gotoPage(page)
        return false

    _gotoPage: (page) ->
        if page <= @total_pages
            @current_page = page
            @_loadData()

    _clickHeader: (e) ->
        $th = $(e.target).closest('th')

        if $th.length
            key = $th.data('key')

            if key == @order_by
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

SimpleWidget.register(SimpleDataGrid, 'simple_datagrid')


slugify = (string) ->
    return string.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '').toLowerCase()

buildUrl = (url, query_parameters) ->
    if query_parameters
        return url + '?' + $.param(query_parameters)
    else
        return url

@SimpleDataGrid = SimpleDataGrid
SimpleDataGrid.slugify = slugify
SimpleDataGrid.buildUrl = buildUrl

SortOrder =
    ASCENDING: 1
    DESCENDING: 2
