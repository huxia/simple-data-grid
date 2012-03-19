(function() {
  var $, ColumnInfo, Paginator, buildUrl, slugify;

  $ = this.jQuery;

  slugify = function(string) {
    return string.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '').toLowerCase();
  };

  buildUrl = function(url, query_parameters) {
    var is_first, key, result, value;
    result = url;
    is_first = true;
    for (key in query_parameters) {
      value = query_parameters[key];
      if (is_first) {
        result += '?';
        is_first = false;
      } else {
        result += '&';
      }
      result += "" + key + "=" + value;
    }
    return result;
  };

  this.SimpleDataGrid = {
    slugify: slugify,
    buildUrl: buildUrl
  };

  ColumnInfo = (function() {

    function ColumnInfo(title, key, on_generate) {
      this.title = title;
      this.key = key || slugify(title);
      this.on_generate = on_generate;
    }

    return ColumnInfo;

  })();

  Paginator = (function() {

    function Paginator(element, number_of_columns, url, on_load_data) {
      this.element = element;
      this.number_of_columns = number_of_columns;
      this.url = url;
      this.on_load_data = on_load_data;
      this.page = 1;
      this.total_pages = 1;
      this._bindEvents();
    }

    Paginator.prototype._bindEvents = function() {
      this.element.delegate('.paginator .first', 'click', $.proxy(this._handleClickFirstPage, this));
      this.element.delegate('.paginator .previous', 'click', $.proxy(this._handleClickPreviousPage, this));
      this.element.delegate('.paginator .next', 'click', $.proxy(this._handleClickNextPage, this));
      return this.element.delegate('.paginator .last', 'click', $.proxy(this._handleClickLastPage, this));
    };

    Paginator.prototype.removeEvents = function() {
      this.element.undelegate('.paginator .first', 'click');
      this.element.undelegate('.paginator .previous', 'click');
      this.element.undelegate('.paginator .next', 'click');
      return this.element.undelegate('.paginator .last', 'click');
    };

    Paginator.prototype.buildHtml = function() {
      var html;
      if (!this.total_pages || this.total_pages === 1) {
        return '';
      } else {
        html = "<tr><td class=\"paginator\" colspan=\"" + this.number_of_columns + "\">";
        if (!this.page || this.page === 1) {
          html += '<span class="first">first</span>';
          html += '<span class="previous">previous</span>';
        } else {
          html += "<a href=\"" + (this.getUrl(1)) + "\" class=\"first\">first</a>";
          html += "<a href=\"" + (this.getUrl(this.page - 1)) + "\" class=\"previous\">previous</a>";
        }
        html += "<span>page " + this.page + " of " + this.total_pages + "</span>";
        if (!this.page || this.page === this.total_pages) {
          html += '<span class="next">next</span>';
          html += '<span class="last"></span>';
        } else {
          html += "<a href=\"" + (this.getUrl(this.page + 1)) + "\" class=\"next\">next</a>";
          html += "<a href=\"" + (this.getUrl(this.total_pages)) + "\" class=\"last\">last</a>";
        }
        html += "</td></tr>";
        return html;
      }
    };

    Paginator.prototype._handleClickFirstPage = function(e) {
      this._gotoPage(1);
      return false;
    };

    Paginator.prototype._handleClickPreviousPage = function(e) {
      this._gotoPage(this.page - 1);
      return false;
    };

    Paginator.prototype._handleClickNextPage = function(e) {
      this._gotoPage(this.page + 1);
      return false;
    };

    Paginator.prototype._handleClickLastPage = function(e) {
      this._gotoPage(this.total_pages);
      return false;
    };

    Paginator.prototype._gotoPage = function(page) {
      if (page <= this.total_pages) {
        this.page = page;
        return this.on_load_data();
      }
    };

    Paginator.prototype.getUrl = function(page) {
      if (!this.url) return '#';
      if (!(page != null)) page = this.page;
      if (!page || page === 1) {
        return this.url;
      } else {
        return this.url + ("?page=" + page);
      }
    };

    Paginator.prototype.getQueryParameters = function() {
      var page;
      page = this.page;
      if (!page || page === 1) {
        return {};
      } else {
        return {
          page: page
        };
      }
    };

    return Paginator;

  })();

  $.widget("ui.simple_datagrid", {
    options: {
      onGetData: null
    },
    _create: function() {
      this.url = this._getBaseUrl();
      this._generateColumnData();
      this._createPaginator();
      this._createDomElements();
      this._bindEvents();
      this._loadData();
      this.$selected_row = null;
      return this.parameters = {};
    },
    destroy: function() {
      this._removeDomElements();
      this._removeEvents();
      return $.Widget.prototype.destroy.call(this);
    },
    getSelectedRow: function() {
      if (this.$selected_row) {
        return this.$selected_row.data('row');
      } else {
        return null;
      }
    },
    reload: function() {
      return this._loadData();
    },
    setParameter: function(key, value) {
      return this.parameters[key] = value;
    },
    getColumns: function() {
      return this.columns;
    },
    _generateColumnData: function() {
      var generateFromOptions, generateFromThElements,
        _this = this;
      generateFromThElements = function() {
        var $th_elements;
        $th_elements = _this.element.find('th');
        _this.columns = [];
        return $th_elements.each(function(i, th) {
          var $th, key, title;
          $th = $(th);
          title = $th.text();
          key = $th.data('key');
          return _this.columns.push(new ColumnInfo(title, key));
        });
      };
      generateFromOptions = function() {
        var column, column_info, _i, _len, _ref, _results;
        _this.columns = [];
        _ref = _this.options.columns;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          column = _ref[_i];
          if (typeof column === 'object') {
            column_info = new ColumnInfo(column.title, column.key, column.on_generate);
          } else {
            column_info = new ColumnInfo(column);
          }
          _results.push(_this.columns.push(column_info));
        }
        return _results;
      };
      if (this.options.columns) {
        return generateFromOptions();
      } else {
        return generateFromThElements();
      }
    },
    _createPaginator: function() {
      return this.paginator = new Paginator(this.element, this.columns.length, this.url, $.proxy(this._loadData, this));
    },
    _createDomElements: function() {
      var initBody, initFoot, initHead, initTable,
        _this = this;
      initTable = function() {
        return _this.element.addClass('simple-data-grid');
      };
      initBody = function() {
        _this.$tbody = _this.element.find('tbody');
        if (_this.$tbody.length) {
          return _this.$tbody.empty();
        } else {
          _this.$tbody = $('<tbody></tbody>');
          return _this.element.append(_this.$tbody);
        }
      };
      initFoot = function() {
        _this.$tfoot = _this.element.find('tfoot');
        if (_this.$tfoot.length) {
          return _this.$tfoot.empty();
        } else {
          _this.$tfoot = $('<tfoot></tfoot>');
          return _this.element.append(_this.$tfoot);
        }
      };
      initHead = function() {
        var column, html, _i, _len, _ref;
        _this.$thead = _this.element.find('thead');
        if (_this.$thead.length) {
          _this.$thead.empty();
        } else {
          _this.$thead = $('<thead></thead>');
          _this.element.append(_this.$thead);
        }
        html = '<tr>';
        _ref = _this.columns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          column = _ref[_i];
          html += "<th data-key=\"" + column.key + "\">" + column.title + "</th>";
        }
        html += '</tr>';
        return _this.$thead.append($(html));
      };
      initTable();
      initHead();
      initBody();
      return initFoot();
    },
    _removeDomElements: function() {
      this.element.removeClass('simple-data-grid');
      this.$tbody.remove();
      return this.$tbody = null;
    },
    _bindEvents: function() {
      return this.element.delegate('tbody tr', 'click', $.proxy(this._clickRow, this));
    },
    _removeEvents: function() {
      this.element.undelegate('tbody tr', 'click');
      return this.paginator.removeEvents();
    },
    _getBaseUrl: function() {
      var url;
      url = this.options.url;
      if (url) {
        return url;
      } else {
        return this.element.data('url');
      }
    },
    _clickRow: function(e) {
      var $tr, event;
      if (this.$selected_row) this.$selected_row.removeClass('selected');
      $tr = $(e.target).closest('tr');
      $tr.addClass('selected');
      this.$selected_row = $tr;
      event = $.Event('datagrid.select');
      return this.element.trigger(event);
    },
    _loadData: function() {
      var getDataFromArray, getDataFromCallback, getDataFromUrl, query_parameters,
        _this = this;
      query_parameters = $.extend({}, this.parameters, this.paginator.getQueryParameters());
      getDataFromCallback = function() {
        return _this.options.onGetData(query_parameters, $.proxy(_this._fillGrid, _this));
      };
      getDataFromUrl = function() {
        var url;
        url = buildUrl(_this.paginator.url, query_parameters);
        return $.ajax({
          url: url,
          success: function(result) {
            return _this._fillGrid(result);
          },
          datatType: 'json',
          cache: false
        });
      };
      getDataFromArray = function() {
        return _this._fillGrid(_this.options.data);
      };
      if (this.options.onGetData) {
        return getDataFromCallback();
      } else if (this.url) {
        return getDataFromUrl();
      } else if (this.options.data) {
        return getDataFromArray();
      }
    },
    _fillGrid: function(data) {
      var addRowFromArray, addRowFromObject, fillFooter, fillRows, generateTr, rows,
        _this = this;
      addRowFromObject = function(row) {
        var column, html, value, _i, _len, _ref;
        html = '';
        _ref = _this.columns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          column = _ref[_i];
          if (column.key in row) {
            value = row[column.key];
            if (column.on_generate) value = column.on_generate(value, row);
          } else {
            value = '';
          }
          html += "<td>" + value + "</td>";
        }
        return html;
      };
      addRowFromArray = function(row) {
        var column, html, i, value, _len;
        html = '';
        for (i = 0, _len = row.length; i < _len; i++) {
          value = row[i];
          column = _this.columns[i];
          if (column.on_generate) value = column.on_generate(value, row);
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
        var $tr, html, row, _i, _len, _results;
        _this.$tbody.empty();
        _results = [];
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
          _results.push(_this.$tbody.append($tr));
        }
        return _results;
      };
      fillFooter = function() {
        return _this.$tfoot.html(_this.paginator.buildHtml());
      };
      if ($.isArray(data)) {
        rows = data;
        this.paginator.total_pages = 0;
      } else if (data.rows) {
        rows = data.rows;
        this.paginator.total_pages = data.total_pages || 0;
      } else {
        rows = [];
      }
      fillRows(rows);
      return fillFooter();
    }
  });

}).call(this);
