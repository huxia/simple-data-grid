// Generated by CoffeeScript 1.3.1

/*
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
*/


(function() {
  var $, SimpleDataGrid, SimpleWidget, SortOrder, buildUrl, max, min, range, slugify,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  $ = this.jQuery;

  SimpleWidget = (function() {

    SimpleWidget.name = 'SimpleWidget';

    SimpleWidget.prototype.defaults = {};

    function SimpleWidget(el, options) {
      this.$el = $(el);
      this.options = $.extend({}, this.defaults, options);
      this._init();
    }

    SimpleWidget.prototype.destroy = function() {
      return this._deinit();
    };

    SimpleWidget.prototype._init = function() {
      return null;
    };

    SimpleWidget.prototype._deinit = function() {
      return null;
    };

    SimpleWidget.register = function(widget_class, widget_name) {
      var callFunction, createWidget, destroyWidget, getDataKey;
      getDataKey = function() {
        return "simple_widget_" + widget_name;
      };
      createWidget = function($el, options) {
        var data_key;
        data_key = getDataKey();
        $el.each(function() {
          var widget;
          widget = new widget_class(this, options);
          if (!$.data(this, data_key)) {
            return $.data(this, data_key, widget);
          }
        });
        return $el;
      };
      destroyWidget = function($el) {
        var data_key;
        data_key = getDataKey();
        return $el.each(function() {
          var widget;
          widget = $.data(this, data_key);
          if (widget && (widget instanceof SimpleWidget)) {
            widget.destroy();
          }
          return $.removeData(this, data_key);
        });
      };
      callFunction = function($el, function_name, args) {
        var result;
        result = null;
        $el.each(function() {
          var widget, widget_function;
          widget = $.data(this, getDataKey());
          if (widget && (widget instanceof SimpleWidget)) {
            widget_function = widget[function_name];
            if (widget_function && (typeof widget_function === 'function')) {
              return result = widget_function.apply(widget, args);
            }
          }
        });
        return result;
      };
      return $.fn[widget_name] = function() {
        var $el, args, argument1, function_name, options;
        argument1 = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        $el = this;
        if (argument1 === void 0 || typeof argument1 === 'object') {
          options = argument1;
          return createWidget($el, options);
        } else if (typeof argument1 === 'string' && argument1[0] !== '_') {
          function_name = argument1;
          if (function_name === 'destroy') {
            return destroyWidget($el);
          } else {
            return callFunction($el, function_name, args);
          }
        }
      };
    };

    return SimpleWidget;

  })();

  this.SimpleWidget = SimpleWidget;

  /*
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
  */


  $ = this.jQuery;

  SimpleWidget = this.SimpleWidget;

  min = function(value1, value2) {
    if (value1 < value2) {
      return value1;
    } else {
      return value2;
    }
  };

  max = function(value1, value2) {
    if (value1 > value2) {
      return value1;
    } else {
      return value2;
    }
  };

  range = function(start, stop) {
    var array, i, len;
    len = stop - start;
    array = new Array(len);
    i = 0;
    while (i < len) {
      array[i] = start;
      start += 1;
      i += 1;
    }
    return array;
  };

  SimpleDataGrid = (function(_super) {

    __extends(SimpleDataGrid, _super);

    SimpleDataGrid.name = 'SimpleDataGrid';

    function SimpleDataGrid() {
      return SimpleDataGrid.__super__.constructor.apply(this, arguments);
    }

    SimpleDataGrid.prototype.defaults = {
      on_get_data: null,
      order_by: null,
      url: null,
      data: null
    };

    SimpleDataGrid.prototype.loadData = function(data) {
      return this._fillGrid(data);
    };

    SimpleDataGrid.prototype.getColumns = function() {
      return this.columns;
    };

    SimpleDataGrid.prototype.getSelectedRow = function() {
      if (this.$selected_row) {
        return this.$selected_row.data('row');
      } else {
        return null;
      }
    };

    SimpleDataGrid.prototype.reload = function() {
      return this._loadData();
    };

    SimpleDataGrid.prototype.setParameter = function(key, value) {
      return this.parameters[key] = value;
    };

    SimpleDataGrid.prototype.setCurrentPage = function(page) {
      return this.current_page = page;
    };

    SimpleDataGrid.prototype._init = function() {
      this.url = this._getBaseUrl();
      this.$selected_row = null;
      this.current_page = 1;
      this.parameters = {};
      this.order_by = this.options.order_by;
      this.sort_order = SortOrder.ASCENDING;
      this._generateColumnData();
      this._createDomElements();
      this._bindEvents();
      return this._loadData();
    };

    SimpleDataGrid.prototype._deinit = function() {
      this._removeDomElements();
      this._removeEvents();
      this.columns = [];
      this.options = {};
      this.parameters = {};
      this.order_by = null;
      this.sort_order = SortOrder.ASCENDING;
      this.$selected_row = null;
      this.current_page = 1;
      return this.url = null;
    };

    SimpleDataGrid.prototype._getBaseUrl = function() {
      var url;
      url = this.options.url;
      if (url) {
        return url;
      } else {
        return this.$el.data('url');
      }
    };

    SimpleDataGrid.prototype._generateColumnData = function() {
      var generateFromOptions, generateFromThElements,
        _this = this;
      generateFromThElements = function() {
        var $th_elements;
        $th_elements = _this.$el.find('th');
        _this.columns = [];
        return $th_elements.each(function(i, th) {
          var $th, key, title;
          $th = $(th);
          title = $th.text();
          key = $th.data('key') || slugify(title);
          return _this.columns.push({
            title: title,
            key: key
          });
        });
      };
      generateFromOptions = function() {
        var column, column_info, _i, _len, _ref;
        _this.columns = [];
        _ref = _this.options.columns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          column = _ref[_i];
          if (typeof column === 'object') {
            column_info = {
              title: column.title,
              key: column.key || slugify(column.title),
              on_generate: column.on_generate
            };
          } else {
            column_info = {
              title: column,
              key: slugify(column)
            };
          }
          _this.columns.push(column_info);
        }
        return null;
      };
      if (this.options.columns) {
        return generateFromOptions();
      } else {
        return generateFromThElements();
      }
    };

    SimpleDataGrid.prototype._createDomElements = function() {
      var initBody, initFoot, initHead, initTable,
        _this = this;
      initTable = function() {
        return _this.$el.addClass('simple-data-grid');
      };
      initBody = function() {
        _this.$tbody = _this.$el.find('tbody');
        if (_this.$tbody.length) {
          return _this.$tbody.empty();
        } else {
          _this.$tbody = $('<tbody></tbody>');
          return _this.$el.append(_this.$tbody);
        }
      };
      initFoot = function() {
        _this.$tfoot = _this.$el.find('tfoot');
        if (_this.$tfoot.length) {
          return _this.$tfoot.empty();
        } else {
          _this.$tfoot = $('<tfoot></tfoot>');
          return _this.$el.append(_this.$tfoot);
        }
      };
      initHead = function() {
        _this.$thead = _this.$el.find('thead');
        if (_this.$thead.length) {
          return _this.$thead.empty();
        } else {
          _this.$thead = $('<thead></thead>');
          return _this.$el.append(_this.$thead);
        }
      };
      initTable();
      initHead();
      initBody();
      return initFoot();
    };

    SimpleDataGrid.prototype._removeDomElements = function() {
      this.$el.removeClass('simple-data-grid');
      if (this.$tbody) {
        this.$tbody.remove();
      }
      return this.$tbody = null;
    };

    SimpleDataGrid.prototype._bindEvents = function() {
      this.$el.delegate('tbody tr', 'click', $.proxy(this._clickRow, this));
      this.$el.delegate('thead th a', 'click', $.proxy(this._clickHeader, this));
      return this.$el.delegate('.paginator .page', 'click', $.proxy(this._handleClickPage, this));
    };

    SimpleDataGrid.prototype._removeEvents = function() {
      this.$el.undelegate('tbody tr', 'click');
      this.$el.undelegate('tbody thead th a', 'click');
      return this.$el.undelegate('.paginator .page', 'click');
    };

    SimpleDataGrid.prototype._loadData = function() {
      var getDataFromArray, getDataFromCallback, getDataFromUrl, query_parameters,
        _this = this;
      query_parameters = $.extend({}, this.parameters, {
        page: this.current_page
      });
      if (this.order_by) {
        query_parameters.order_by = this.order_by;
        if (this.sort_order === SortOrder.DESCENDING) {
          query_parameters.sortorder = 'desc';
        } else {
          query_parameters.sortorder = 'asc';
        }
      }
      getDataFromCallback = function() {
        return _this.options.on_get_data(query_parameters, $.proxy(_this._fillGrid, _this));
      };
      getDataFromUrl = function() {
        var url;
        url = buildUrl(_this.url, query_parameters);
        return $.ajax({
          url: url,
          success: function(response) {
            var result;
            if ($.isArray(response) || typeof response === 'object') {
              result = response;
            } else {
              result = $.parseJSON(response);
            }
            return _this._fillGrid(result);
          },
          cache: false
        });
      };
      getDataFromArray = function() {
        return _this._fillGrid(_this.options.data);
      };
      if (this.options.on_get_data) {
        return getDataFromCallback();
      } else if (this.url) {
        return getDataFromUrl();
      } else if (this.options.data) {
        return getDataFromArray();
      } else {
        return this._fillGrid([]);
      }
    };

    SimpleDataGrid.prototype._fillGrid = function(data) {
      var addRowFromArray, addRowFromObject, event, fillFooter, fillHeader, fillPaginator, fillRows, generateTr, rows, total_pages,
        _this = this;
      addRowFromObject = function(row) {
        var column, html, value, _i, _len, _ref;
        html = '';
        _ref = _this.columns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          column = _ref[_i];
          if (column.key in row) {
            value = row[column.key];
            if (column.on_generate) {
              value = column.on_generate(value, row);
            }
          } else {
            if (column.on_generate) {
              value = column.on_generate(null, row);
            } else {
              value = '';
            }
          }
          html += "<td>" + value + "</td>";
        }
        return html;
      };
      addRowFromArray = function(row) {
        var column, html, i, value, _i, _len;
        html = '';
        for (i = _i = 0, _len = row.length; _i < _len; i = ++_i) {
          value = row[i];
          column = _this.columns[i];
          if (column.on_generate) {
            value = column.on_generate(value, row);
          }
          html += "<td>" + value + "</td>";
        }
        return html;
      };
      generateTr = function(row) {
        var data_string;
        if (row.id) {
          data_string = " data-id=\"" + row.id + "\"";
        } else {
          data_string = "";
        }
        return "<tr" + data_string + ">";
      };
      fillRows = function(rows) {
        var $tr, html, row, _i, _len;
        _this.$tbody.empty();
        for (_i = 0, _len = rows.length; _i < _len; _i++) {
          row = rows[_i];
          html = generateTr(row);
          if ($.isArray(row)) {
            html += addRowFromArray(row);
          } else {
            html += addRowFromObject(row);
          }
          html += '</tr>';
          $tr = $(html);
          $tr.data('row', row);
          _this.$tbody.append($tr);
        }
        return null;
      };
      fillFooter = function(total_pages, row_count) {
        var html;
        if (!total_pages || total_pages === 1) {
          if (row_count === 0) {
            html = "<tr><td colspan=\"" + _this.columns.length + "\">No rows</td></tr>";
          } else {
            html = '';
          }
        } else {
          html = "<tr><td class=\"paginator\" colspan=\"" + _this.columns.length + "\">";
          html += fillPaginator(_this.current_page, total_pages);
          html += "</td></tr>";
        }
        return _this.$tfoot.html(html);
      };
      fillPaginator = function(current_page, total_pages) {
        var html, page, pages, _i, _len;
        html = '';
        pages = _this._getPages(current_page, total_pages);
        if (current_page > 1) {
          html += "<a href=\"#\" data-page=\"" + (current_page - 1) + "\" class=\"page\">&lsaquo;&lsaquo; previous</a>";
        } else {
          html += "<span>&lsaquo;&lsaquo; previous</span>";
        }
        for (_i = 0, _len = pages.length; _i < _len; _i++) {
          page = pages[_i];
          if (!page) {
            html += '...';
          } else {
            if (page === current_page) {
              html += "<span class=\"current\">" + page + "</span>";
            } else {
              html += "<a href=\"#\" data-page=\"" + page + "\" class=\"page\">" + page + "</a>";
            }
          }
        }
        if (current_page < total_pages) {
          html += "<a href=\"#\" data-page=\"" + (current_page + 1) + "\" class=\"page\">next &rsaquo;&rsaquo;</a>";
        } else {
          html += "<span>next &rsaquo;&rsaquo;</span>";
        }
        return html;
      };
      fillHeader = function(row_count) {
        var class_html, column, html, _i, _len, _ref;
        html = '<tr>';
        _ref = _this.columns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          column = _ref[_i];
          html += "<th data-key=\"" + column.key + "\">";
          if ((!_this.order_by) || (row_count === 0)) {
            html += column.title;
          } else {
            html += "<a href=\"#\">" + column.title;
            if (column.key === _this.order_by) {
              class_html = "sort ";
              if (_this.sort_order === SortOrder.DESCENDING) {
                class_html += "asc sprite-icons-down";
              } else {
                class_html += "desc sprite-icons-up";
              }
              html += "<span class=\"" + class_html + "\">sort</span>";
            }
            html += "</a>";
          }
          html += "</th>";
        }
        html += '</tr>';
        return _this.$thead.html(html);
      };
      if ($.isArray(data)) {
        rows = data;
        total_pages = 0;
      } else if (data.rows) {
        rows = data.rows;
        total_pages = data.total_pages || 0;
      } else {
        rows = [];
      }
      this.total_pages = total_pages;
      fillRows(rows);
      fillFooter(total_pages, rows.length);
      fillHeader(rows.length);
      event = $.Event('datagrid.load_data');
      return this.$el.trigger(event);
    };

    SimpleDataGrid.prototype._clickRow = function(e) {
      var $tr, event;
      if (this.$selected_row) {
        this.$selected_row.removeClass('selected');
      }
      $tr = $(e.target).closest('tr');
      $tr.addClass('selected');
      this.$selected_row = $tr;
      event = $.Event('datagrid.select');
      return this.$el.trigger(event);
    };

    SimpleDataGrid.prototype._handleClickPage = function(e) {
      var $link, page;
      $link = $(e.target);
      page = $link.data('page');
      this._gotoPage(page);
      return false;
    };

    SimpleDataGrid.prototype._gotoPage = function(page) {
      if (page <= this.total_pages) {
        this.current_page = page;
        return this._loadData();
      }
    };

    SimpleDataGrid.prototype._clickHeader = function(e) {
      var $th, key;
      $th = $(e.target).closest('th');
      if ($th.length) {
        key = $th.data('key');
        if (key === this.order_by) {
          if (this.sort_order === SortOrder.ASCENDING) {
            this.sort_order = SortOrder.DESCENDING;
          } else {
            this.sort_order = SortOrder.ASCENDING;
          }
        } else {
          this.sort_order = SortOrder.ASCENDING;
        }
        this.order_by = key;
        this.current_page = 1;
        this._loadData();
      }
      return false;
    };

    SimpleDataGrid.prototype._getPages = function(current_page, total_pages, page_window) {
      var current_end, current_range, current_start, first_end, first_gap, first_range, last_gap, last_range, last_start;
      if (page_window == null) {
        page_window = 4;
      }
      first_end = min(page_window, total_pages);
      last_start = max(1, (total_pages - page_window) + 1);
      current_start = max(1, current_page - page_window);
      current_end = min(total_pages, current_page + page_window);
      if (first_end >= current_start) {
        current_start = 1;
        first_range = [];
      } else {
        first_range = range(1, first_end + 1);
      }
      if (current_end >= last_start) {
        current_end = total_pages;
        last_range = [];
      } else {
        last_range = range(last_start, total_pages + 1);
      }
      current_range = range(current_start, current_end + 1);
      first_gap = current_start - first_end;
      if (first_gap === 2) {
        first_range.push(first_end + 1);
      } else if (first_gap > 2) {
        first_range.push(0);
      }
      last_gap = last_start - current_end;
      if (last_gap === 2) {
        current_range.push(current_end + 1);
      } else if (last_gap > 2) {
        current_range.push(0);
      }
      return first_range.concat(current_range, last_range);
    };

    SimpleDataGrid.prototype.testGetPages = function(current_page, total_pages, page_window) {
      if (page_window == null) {
        page_window = 4;
      }
      return this._getPages(current_page, total_pages, page_window);
    };

    return SimpleDataGrid;

  })(SimpleWidget);

  SimpleWidget.register(SimpleDataGrid, 'simple_datagrid');

  slugify = function(string) {
    return string.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '').toLowerCase();
  };

  buildUrl = function(url, query_parameters) {
    if (query_parameters) {
      return url + '?' + $.param(query_parameters);
    } else {
      return url;
    }
  };

  this.SimpleDataGrid = SimpleDataGrid;

  SimpleDataGrid.slugify = slugify;

  SimpleDataGrid.buildUrl = buildUrl;

  SortOrder = {
    ASCENDING: 1,
    DESCENDING: 2
  };

}).call(this);
