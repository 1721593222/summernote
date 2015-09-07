define([
  'jquery',
  'summernote/base/core/list',
  'summernote/base/core/agent'
], function ($, list, agent) {
  var Toolbar = function (summernote) {
    var self = this;
    var renderer = $.summernote.renderer;

    var $note = summernote.layoutInfo.note;
    var $toolbar = summernote.layoutInfo.toolbar;
    var options = summernote.options;

    this.createInvokeHandler = function (namespace) {
      return function (event) {
        event.preventDefault();
        var value = $(event.target).data('value');
        summernote.invoke(namespace, [value]);
      };
    };

    this.updateCurrentStyle = function () {
      var styleInfo = summernote.invoke('editor.currentStyle');
      self.updateBtnStates({
        '.note-btn-bold': function () {
          return styleInfo['font-bold'] === 'bold';
        },
        '.note-btn-italic': function () {
          return styleInfo['font-italic'] === 'italic';
        },
        '.note-btn-underline': function () {
          return styleInfo['font-underline'] === 'underline';
        }
      });

      if (styleInfo['font-family']) {
        var fontNames = styleInfo['font-family'].split(',').map(function (name) {
          return name.replace(/[\'\"]/g, '')
                     .replace(/\s+$/, '')
                     .replace(/^\s+/, '');
        });
        var fontName = list.find(fontNames, function (name) {
          return agent.isFontInstalled(name) ||
                 list.contains(options.fontNamesIgnoreCheck, name);
        });

        $toolbar.find('.dropdown-fontname li a').each(function () {
          // always compare string to avoid creating another func.
          var isChecked = ($(this).data('value') + '') === (fontName + '');
          this.className = isChecked ? 'checked' : '';
        });
        $toolbar.find('.note-current-fontname').text(fontName);
      }

      if (styleInfo['font-size']) {
        var fontSize = styleInfo['font-size'];
        $toolbar.find('.dropdown-fontsize li a').each(function () {
          // always compare with string to avoid creating another func.
          var isChecked = ($(this).data('value') + '') === (fontSize + '');
          this.className = isChecked ? 'checked' : '';
        });
        $toolbar.find('.note-current-fontsize').text(fontSize);
      }

      if (styleInfo['line-height']) {
        var lineHeight = styleInfo['line-height'];
        $toolbar.find('.dropdown-line-height li a').each(function () {
          // always compare with string to avoid creating another func.
          var isChecked = ($(this).data('value') + '') === (lineHeight + '');
          this.className = isChecked ? 'checked' : '';
        });
      }
    };

    this.initialize = function () {
      $note.on('summernote.keyup summernote.mouseup summernote.change', function () {
        self.updateCurrentStyle();
      });

      $toolbar.append(renderer.buttonGroup([
        renderer.button({
          className: 'dropdown-toggle',
          contents: '<i class="fa fa-magic" /> <span class="caret" />',
          tooltip: 'Style',
          data: {
            toggle: 'dropdown'
          }
        }),
        renderer.dropdown({
          className: 'dropdown-style',
          items: options.styleTags,
          click: this.createInvokeHandler('editor.formatBlock')
        })
      ]).build());

      $toolbar.append(renderer.buttonGroup([
        renderer.button({
          className: 'note-btn-bold',
          contents: '<i class="fa fa-bold" />',
          tooltip: 'Bold (⌘+B)',
          click: this.createInvokeHandler('editor.bold')
        }),
        renderer.button({
          className: 'note-btn-italic',
          contents: '<i class="fa fa-italic" />',
          tooltip: 'Italic (⌘+I)',
          click: this.createInvokeHandler('editor.italic')
        }),
        renderer.button({
          className: 'note-btn-underline',
          contents: '<i class="fa fa-underline" />',
          tooltip: 'Underline (⌘+U)',
          click: this.createInvokeHandler('editor.underline')
        }),
        renderer.button({
          contents: '<i class="fa fa-eraser" />',
          tooltip: 'Remove Font Style (⌘+\\)',
          click: this.createInvokeHandler('editor.removeFormat')
        })
      ]).build());

      $toolbar.append(renderer.buttonGroup([
        renderer.button({
          className: 'dropdown-toggle',
          contents: '<span class="note-current-fontname" /> <span class="caret" />',
          tooltip: 'Font Family',
          data: {
            toggle: 'dropdown'
          }
        }),
        renderer.dropdownCheck({
          className: 'dropdown-fontname',
          items: options.fontNames.filter(function (name) {
            return agent.isFontInstalled(name) ||
                   list.contains(options.fontNamesIgnoreCheck, name);
          }),
          click: this.createInvokeHandler('editor.fontName')
        })
      ]).build());

      $toolbar.append(renderer.buttonGroup([
        renderer.button({
          className: 'dropdown-toggle',
          contents: '<span class="note-current-fontsize" /> <span class="caret" />',
          tooltip: 'Font Size',
          data: {
            toggle: 'dropdown'
          }
        }),
        renderer.dropdownCheck({
          className: 'dropdown-fontsize',
          items: options.fontSizes,
          click: this.createInvokeHandler('editor.fontSize')
        })
      ]).build());

      $toolbar.append(renderer.buttonGroup([
        renderer.button({
          contents: '<i class="fa fa-font note-recent-color"/>',
          tooltip: 'Recent Color',
          click: this.createInvokeHandler('editor.color'),
          callback: function ($button) {
            var $recentColor = $button.find('.note-recent-color');
            $recentColor.css({
              'background-color': 'yellow'
            }).data('value', {
              backColor: 'yellow'
            });
          }
        }),
        renderer.button({
          className: 'dropdown-toggle',
          contents: '<span class="caret"/>',
          tooltip: 'More Color',
          data: {
            toggle: 'dropdown'
          }
        }),
        renderer.dropdown({
          items: [
            '<li>',
            '<div class="btn-group">',
            '  <div class="note-palette-title">background color</div>',
            '  <div class="note-color-reset" data-event="backColor" data-value="inherit">transparent</div>',
            '  <div class="note-holder" data-event="backColor"/>',
            '</div>',
            '<div class="btn-group">',
            '  <div class="note-palette-title">fore color</div>',
            '  <div class="note-color-reset" data-event="foreColor" data-value="inherit">reset to default</div>',
            '  <div class="note-holder" data-event="foreColor"/>',
            '</div>',
            '</li>'
          ].join(''),
          callback: function ($dropdown) {
            $dropdown.find('.note-holder').each(function () {
              var $holder = $(this);
              $holder.append(renderer.palette({
                colors: options.colors,
                eventName: $holder.data('event')
              }).build());
            });
          },
          click: function (event) {
            var $button = $(event.target);
            var eventName = $button.data('event');
            var value = $button.data('value');

            if (eventName && value) {
              var key = eventName === 'backColor' ? 'background-color' : 'color';
              var $color = $button.closest('.note-color').find('.note-recent-color');

              var colorInfo = $color.data('value');
              colorInfo[eventName] = value;
              $color.data('value', colorInfo)
                    .css(key, value);

              summernote.invoke('editor.' + eventName, [value]);
            }
          }
        })
      ], {
        className: 'note-color'
      }).build());

      $toolbar.append(renderer.buttonGroup([
        renderer.button({
          contents: '<i class="fa fa-list-ul"/>',
          tooltip: 'Unordered list (⌘+⇧+NUM7)',
          click: this.createInvokeHandler('editor.insertUnorderedList')
        }),
        renderer.button({
          contents: '<i class="fa fa-list-ol"/>',
          tooltip: 'Ordered list (⌘+⇧+NUM8)',
          click: this.createInvokeHandler('editor.insertOrderedList')
        }),
        renderer.buttonGroup([
          renderer.button({
            className: 'dropdown-toggle',
            contents: '<i class="fa fa-align-left"/> <span class="caret"/>',
            tooltip: 'More paragraph style',
            data: {
              toggle: 'dropdown'
            }
          }),
          renderer.dropdown([
            renderer.buttonGroup([
              renderer.button({
                contents: '<i class="fa fa-align-left"></i>',
                click: this.createInvokeHandler('editor.justifyLeft')
              }),
              renderer.button({
                contents: '<i class="fa fa-align-center"></i>',
                click: this.createInvokeHandler('editor.justifyCenter')
              }),
              renderer.button({
                contents: '<i class="fa fa-align-right"></i>',
                click: this.createInvokeHandler('editor.justifyRight')
              }),
              renderer.button({
                contents: '<i class="fa fa-align-justify"></i>',
                click: this.createInvokeHandler('editor.justifyFull')
              })
            ], {
              className: 'note-align'
            }),
            renderer.buttonGroup([
              renderer.button({
                contents: '<i class="fa fa-outdent"></i>',
                click: this.createInvokeHandler('editor.outdent')
              }),
              renderer.button({
                contents: '<i class="fa fa-indent"></i>',
                click: this.createInvokeHandler('editor.indent')
              })
            ], {
              className: 'note-list'
            })
          ])
        ])
      ], {
        className: 'note-para'
      }).build());

      $toolbar.append(renderer.buttonGroup([
        renderer.button({
          className: 'dropdown-toggle',
          contents: '<i class="fa fa-text-height"/> <span class="caret"/>',
          data: {
            toggle: 'dropdown'
          }
        }),
        renderer.dropdownCheck({
          items: options.lineHeights,
          className: 'dropdown-line-height',
          click: this.createInvokeHandler('editor.lineHeight')
        })
      ]).build());

      this.updateCurrentStyle();
    };

    this.destory = function () {
      $toolbar.children().remove();
    };

    this.updateBtnStates = function (infos) {
      $.each(infos, function (selector, pred) {
        $toolbar.find(selector).toggleClass('active', pred());
      });
    };
  };

  return Toolbar;
});