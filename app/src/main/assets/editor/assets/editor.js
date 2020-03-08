//
//  editor.js
//  DGWebEditor
//
//  Created by Roy on 2019/12/2.
//  Copyright © 2019 Roy. All rights reserved.
//

let BlockEmbed = Quill.import('blots/block/embed');

class DividerBlot extends BlockEmbed {}
DividerBlot.blotName = 'divider';
DividerBlot.tagName = 'hr';

class ImageBlot extends BlockEmbed {

    static create(value) {
        let figure = super.create();
        figure.setAttribute('contenteditable', false);

        let imgContainer = document.createElement('div');
        imgContainer.className = "img-container";
        let img = document.createElement('img');
        img.onload = function () {
            if (this.src.indexOf('blob') === 0) {
                URL.revokeObjectURL(this.src);
            }
        };
        if (typeof value === 'string') {
            img.setAttribute('src', value);
        } else {
            img.setAttribute('src', value.url || '');
        }
        if (typeof value.id === 'string') {
            img.setAttribute('id', value.id);
        }
        if (typeof value.alt === 'string') {
            img.setAttribute('alt', value.alt);
        }

        // 如果有选择文件，把文件对象绑定在 img 标签上，上传用
        if (value.file) {
            $.data(img, 'file', value.file);
        }

        imgContainer.appendChild(img);
        figure.appendChild(imgContainer);

        let figcaption = document.createElement('figcaption');
        figcaption.innerText = value.alt || '';
        figcaption.innerText ='';
        figure.appendChild(figcaption);

        return figure;
    }

    static formats(figure) {
        let img = figure.querySelector('img');
        return {
            id: img ? (img.getAttribute('id') || '') : '',
            url: img ? (img.getAttribute('src') || '') : '',
            alt: img ? (img.getAttribute('alt') || '') : ''
        };
    }

    static value(figure) {
        let img = figure.querySelector('img');
        return {
            id: img ? (img.getAttribute('id') || '') : '',
            url: img ? (img.getAttribute('src') || '') : '',
            alt: img ? (img.getAttribute('alt') || '') : ''
        };
    }

    format(name, value) {
        let img = this.domNode.querySelector('img');
        let figcaption = this.domNode.querySelector('figcaption');

        if (name === 'alt') {
            img.setAttribute(name, value);
            figcaption.innerText = value;
        } else if (name === 'src') {
            img.setAttribute(name, value);
        } else if (name === 'id') {
            img.setAttribute(name, value);
        } else {
            super.format(name, value);
        }
    }

    // 构造
    constructor(domNode) {
        super(domNode);
        let _this = this;
        let $domNode = $(domNode);

        // 图片容器
        _this.$imgContainer = $domNode.find(".img-container");

        // 图片
        _this.$img = $domNode.find("img");

        // 图片描述
        _this.$figcaption = $domNode.find("figcaption");

        // 关闭按钮
        _this.$closeButton = (function () {
            let $button = $('<span class="close-button"/>');
            $button.click(function () {
                let index = quill.getIndex(_this);
                _this.remove();
                quill.focus();
                quill.setSelection(index);
            });
            _this.$imgContainer.append($button);
            return $button;
        })();

        // 编辑描述按钮
        _this.$editDescButton = (function () {
            let $button = $('<span class="edit-desc-button"><i/></span>');
            $button.click(function () {
                let message = {
                    title: "添加图片描述",
                    placeholder: '不超过120字',
                    maxLength: 120,
                };
                let desc = promptformatText(JSON.stringify(message), _this.$figcaption.text());
                if (desc != null) {
                    desc = $.trim(desc);
                    if (desc.length > 120) {
                        desc = desc.substring(0, 120)
                    }
                    _this.setImageDesc(desc);
                }
                quill.focus();
                quill.setSelection(quill.getIndex(_this) + 1);
            });
            _this.$imgContainer.append($button);
            return $button;
        })();

        // 状态视图提示信息
        _this.$statusInfoLabel = $('<label>图片上传失败</label>');
        // 重试按钮
        _this.$statusRetryButton = (function () {
            let $button = $('<span class="retry-button"><i/><b>重试</b></span>');
            $button.click(function () {
                _this.beginUploadImageIfNeed();
            });
            return $button;
        })();
        // 状态视图
        _this.$statusView = (function () {
            let $view = $('<div class="status-view"/>');
            let $content = $('<span class="content"/>');
            $content.append(_this.$statusInfoLabel);
            $content.append(_this.$statusRetryButton);
            $view.append($content);
            _this.$imgContainer.append($view);
            return $view;
        })();

        _this.updateUI(0);
        _this.beginUploadImageIfNeed();

    }

    updateUI(status, data) {
        let _this = this;

        _this.status = status;

        switch(status) {
            case 0: // 初始化状态
                // data = null
                _this.$statusView.hide();
                break;
            case 1: // 上传中
                // data = Percent
                let uploadPercent = data + '%';
                _this.$statusInfoLabel.text('图片上传中 '+ uploadPercent);
                _this.$statusInfoLabel.show();
                _this.$statusRetryButton.hide();
                _this.$statusView.show();
                break;
            case 2: // 上传成功
                // data = APIData
                _this.$statusView.hide();
                break;
            case 3: // 上传失败
                // data = Error or APIData
                _this.$statusInfoLabel.text('图片上传失败');
                _this.$statusInfoLabel.show();
                _this.$statusRetryButton.show();
                _this.$statusView.show();
                break;
            default:break;
        }
    }

    beginUploadImageIfNeed() {
        let _this = this;
        if (_this.uploadRequest) {
            _this.uploadRequest.abort();
        }

        let imageURL = _this.$img.attr('src');

        // http: https: data:
        let block = imageURL.split(':');
        let scheme = block[0];
        if (scheme !== 'blob') {
            return
        }

        _this.updateUI(1, 0);

        let file = _this.$img.data('file');
        _this.uploadRequest = uploadPicture({
            file: file,
            watermark: true,
            progress: function (percent) {
                _this.updateUI(1, percent);
            },
            success: function (data) {
                try {
                    if (data.result.id) {

                        let oldDelta = quill.editor.delta;

                        // 上传成功，更新 id 和 path
                        _this.$img.attr('id', data.result.id);
                        // 这里服务端会返回不含域名的图片路径，这里补充完整
                        _this.$img.attr('data-path', "http://s1.dgtle.com" + data.result.img_url);

                        // 上传图片成功，发送通知
                        native.cell({
                            __action: 'editorOnEvent',
                            event: 'text-change',
                            source: 'api',
                            value: {
                                delta: quill.editor.delta,
                                oldDelta: oldDelta
                            }
                        });

                        _this.updateUI(2, data);
                    } else {
                        _this.updateUI(3, data);
                    }
                } catch (err) {
                    _this.updateUI(3, err);
                }
            },
            error: function (err) {
                _this.updateUI(3, err);
            }
        });
    }

    setImageDesc(desc) {
        let _this = this;

        _this.$figcaption.text(desc);
        _this.$img.attr('alt', desc);

        if (desc != null && desc !== '') {
            _this.$editDescButton.find('i').addClass("edit");
        } else {
            _this.$editDescButton.find('i').removeClass("edit");
        }


    }

    // 释放
    detach() {
        if (this.uploadRequest) {
            this.uploadRequest.abort();
        }
        super.detach();
    }

}
ImageBlot.blotName = 'image';
ImageBlot.tagName = 'figure';

Quill.register(DividerBlot);
Quill.register(ImageBlot);

let quill = new Quill('#editor-container', {
    placeholder: '正文'
});

quill.ext = {
    getPlaceholder: function () {
        return document.getElementById("editor-container").firstChild.getAttribute('data-placeholder');
    },
    setPlaceholder: function (text) {
        document.getElementById("editor-container").firstChild.setAttribute('data-placeholder', text);
    },
    //插入分割线
    insertDivider: function () {
        let range = quill.getSelection();
        if (range == null ) {
            return
        }

        let p = quill.getLine(range.index)[0].domNode;
        // 如果当前选中行是空白行则少插入一个换行符
        if (p.tagName.toLowerCase() === 'p'
            && p.children.length === 1
            && p.children[0].tagName.toLowerCase() === 'br') {
            quill.insertEmbed(range.index, 'divider', true, Quill.sources.USER);
            quill.setSelection(range.index + 1, Quill.sources.SILENT);
        } else {
            quill.insertText(range.index, '\n', Quill.sources.USER);
            quill.insertEmbed(range.index + 1, 'divider', true, Quill.sources.USER);
            quill.setSelection(range.index + 2, Quill.sources.SILENT);
        }
    },
    //获取内容
    getContent: function () {
        // "coverURL": "blob:null/10511637-bb61-4376-91e8-3f381ed7d19f",
        // "coverURL": "data:image/png;base64,XXX...XXX",
        // "coverURL": "https://x.x/x.png",
        // "titleText": "标题",
        // "bodyHTML": "<h1>...</h1><figure><img id='666' src='https://x.x/x.png' alt='xxx'></figure>"

        let $coverContainer = $('#cover-container');

        let coverURL = $coverContainer.css('background-image')
            .replace('url("', '').replace('")', '');

        // 封面图如果不是 http 开头的则使用 path 代替
        if (coverURL.indexOf('http') !== 0 ) {
            coverURL = $coverContainer.attr('data-path');
        }

        let $content;
        // quill 官方定义，即使内容为空，取到的内容里也还是会有一个 '\n' 字符
        if (quill.getLength() === 1 && quill.getText() === '\n') {
            $content = $('<div></div>');
        } else {
            $content = $('<div>' + quill.root.innerHTML + '</div>');

            // 清理 figure 元素，保证内容为约定的格式
            $content.find('figure').each(function (i) {
                let $figure = $(this);
                $figure.removeAttr('contenteditable');

                let $img = $figure.find('img');

                // 删除没有 图片ID 也不是 http 开头的 img
                if (!$img.attr('id') && $img.attr('src').indexOf('http') !== 0) {
                    $figure.remove();
                    return
                }

                if ($img.attr('src').indexOf('http') !== 0) {
                    $img.removeAttr('src');
                }
                if ($img.attr('data-path')) {
                    $img.attr('src', $img.attr('data-path'));
                }
                $img.removeAttr('data-path');

                $figure.empty();
                $figure.append($img);

                // 删除增加图片时图片上方生成的空白换行
                let $prev = $figure.prev();
                if( $prev.length > 0 ) {
                    let p = $prev[0];
                    if (p.tagName.toLowerCase() === 'p') {
                        if (p.children.length === 1 && p.children[0].tagName.toLowerCase() === 'br') {
                            p.remove();
                        }
                    }
                }
            });
        }

        return {
            coverURL: coverURL,
            titleText: $('#title-editor').text().trim(),
            bodyHTML: $content.html()
        };
    },
    //设置内容
    setContent: function (obj) {
        if (obj.coverURL && obj.coverURL !== "") {
            coverImageManager.updateUI(1, obj.coverURL);
            coverImageManager.updateUI(3);
        } else {
            coverImageManager.updateUI(0);
        }

        $('#title-editor').text(obj.titleText);
        $('#title-tip').text('');

        quill.setContents([]);

        let $content = $('<div>' + obj.bodyHTML + '</div>');

        // 给所有前一个元素还是图片的图片元素前加入一个换行符，用来让用户能在图片之间输入文字，获取内容时会将空白换行移除
        $content.find('figure').each(function (i) {
            let $figure = $(this);
            let $prev = $figure.prev();
            if ( $prev.length > 0 ) {
                if ($prev[0].tagName.toLowerCase() === 'figure') {
                    $figure.before('<br>');
                }
            }
        });

        // 这里 <p><br><\/p> 会被解析成 两个 <p><br><\/p>，提前过滤
        let html = $content.html().replace(/<p><br><\/p>/g,"<br>");
        quill.pasteHTML(html);
    },
    //获取当前的输入焦点
    getFocusInputName: function () {
        if ($('#title-editor').is(':focus')) {
            return 'title';
        } else if (quill.hasFocus()) {
            return 'body';
        } else {
            return null;
        }
    },
    //插入图片
    insertImage: function () {
        let _this = this;
        choosePicture({
            multiple: true,
            onChange: function (files) {
                if (files.length > 9) {
                    alert('一次最多仅可选择 9 张图片，请重新选择');
                    return
                }
                for (let i = 0; i < files.length; i++) {
                    let file = files[i];

                    // blob:null/10511637-bb61-4376-91e8-3f381ed7d19f
                    let url = URL.createObjectURL(file);
                    _this._insertImage(url, '', file);

                    // data:image/png;base64,XXX...XXX
                    // let reader = new FileReader();
                    // reader.onload = function (e) {
                    //     let url = e.target.result
                    //     _this._insertImage(url, '', file);
                    // };
                    // reader.readAsDataURL(file);
                }
            }
        });
    },
    //插入图片
    _insertImage: function (url, alt, file) {
        let range = quill.getSelection(true);
        quill.insertText(range.index, '\n', Quill.sources.USER);
        quill.insertEmbed(range.index + 1, 'image', { url: url, alt: alt, file: file}, Quill.sources.USER);
        quill.setSelection(range.index + 2, Quill.sources.SILENT);
    }
};
//选择图片
function choosePicture(options) {
    let fileInput = document.getElementById('image-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.setAttribute('id', 'image-input');
    }
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('accept', 'image/png, image/gif, image/jpeg, image/bmp, image/x-icon');
    fileInput.setAttribute('style', 'display: none;');
    document.body.appendChild(fileInput);

    if (options.multiple === true) {
        fileInput.setAttribute('multiple', 'multiple');
    } else {
        fileInput.removeAttribute('multiple')
    }
    fileInput.setAttribute('value', '');

    fileInput.onchange = function () {
        options.onChange(fileInput.files);
        fileInput.value = '';
        fileInput.remove();
    };

    fileInput.click();
}
//上传图片
function uploadPicture(options) {
    let formData = new FormData();
    let fileExtension = options.file.name.split('.')[1];
    formData.append("file", options.file, 'image.' + fileExtension);
    if (options.watermark === false) {
        formData.append("watermark", 0);
    }

    let uploadURL = sessionStorage.getItem("upload_url");
    let authorization = sessionStorage.getItem("authorization");

    return $.ajax({
        url: uploadURL,
        type: 'POST', data: formData, timeout: 120 * 1000,
        async: true, processData: false, contentType: false, cache: false,
        headers: {'Authorization': authorization},
        xhr: function () {
            let xhr = $.ajaxSettings.xhr();
            if (xhr.upload) {
                xhr.upload.addEventListener('progress', function (e) {
                    if (e.lengthComputable) {
                        let percent = Math.floor(e.loaded / e.total * 100 * 0.99);
                        console.log('图片上传中', e, percent);
                        options.progress(percent);
                    }
                }, false);
            }
            return xhr;
        },
        success: function (data) {
            console.log('图片上传完成', data);
            options.success(data)
        },
        error: function (err) {
            console.log('图片上传失败', err);
            options.error(err)
        },
    });
}

quill.on('selection-change', function (range, oldRange, source) {

    if (oldRange == null) {
        native.cell({
            __action: 'editorOnFocusChange',
            inputName: 'body'
        });
    }

    native.cell({
        __action: 'editorOnEvent',
        event: 'selection-change',
        source: source,
        value: {
            range: range,
            oldRange: oldRange
        }
    });
});

quill.on('text-change', function (delta, oldContents, source) {
    native.cell({
        __action: 'editorOnEvent',
        event: 'text-change',
        source: source,
        value: {
            delta: delta,
            oldContents: oldContents
        }
    });
});

$('#title-editor').on('paste', function (event) {
    // 清理粘贴的内容，只保留文本
    if (event.originalEvent.clipboardData) {
        // 阻止默认行为
        event.preventDefault();
        let clipboardData = event.originalEvent.clipboardData;
        // 获取剪贴板的文本
        let text = clipboardData.getData('text');
        if (window.getSelection && text !== '' && text !== null) {
            // 创建文本节点
            let textNode = document.createTextNode(text);
            // 在当前的光标处插入文本节点
            let range = window.getSelection().getRangeAt(0);
            // 删除选中文本
            range.deleteContents();
            // 插入文本
            range.insertNode(textNode);
        }
    }
});

$('#title-editor').on('focusin', function (event) {
    native.cell({
        __action: 'editorOnFocusChange',
        inputName: 'title'
    });
});

$('#title-editor').on('input', function (event) {
    let _this = $(this);
    let length = _this.text().length;
    let tip = $('#title-tip');
    if (length > 40) {
        tip.css('color', '#F58C8C');
        tip.text('已超出 ' + (length - 40) + ' 个字');
    } else {
        tip.css('color', '#C6C6C6');
        if (length >= 30) {
            tip.text('还可以输入 ' + (40 - length) + ' 个字');
        } else {
            tip.text('');
        }
    }
    _this.children("div").remove();
    _this.children("br").remove();

    // 标题发生改变通知
    native.cell({__action: 'titleOnTextChange'});

});


class CoverImageManager {

    constructor() {
        let _this = this;

        _this.$coverMask = $('#cover-container .mask');
        _this.$coverTipIcon = $('#cover-tip .icon');
        _this.$coverTipLabel = $('#cover-tip label');
        _this.$coverRetryButton = $('#cover-tip .retry-button');

        _this.$coverContainer = $('#cover-container');
        _this.$coverContainer.click(function (e) {
            _this.handleCoverClick();
        });

        _this.updateUI(0);
    }

    updateUI(status, data) {
        let _this = this;

        _this.status = status;

        switch(status) {
            case 0: // 初始化状态，没有选择图片
                // data = null
                _this.$coverContainer.attr('data-id', '');
                _this.$coverContainer.attr('data-path', '');

                _this.$coverContainer.css('background-image', 'none');
                _this.$coverMask.css('background-color', 'transparent');
                _this.$coverTipIcon.show();
                _this.$coverTipLabel.text('上传封面');
                _this.$coverRetryButton.hide();
                break;
            case 1: // 选择了图片
                // data = image url
                _this.coverURL = data;
                _this.$coverContainer.css('background-image', 'url(' + data + ')');
                _this.$coverMask.css('background-color', 'rgba(0,0,0,0.49)');
                break;
            case 2: // 上传中
                // data = Percent
                _this.$coverTipIcon.hide();
                let uploadPercent = data + '%';
                _this.$coverTipLabel.text('图片上传中 '+ uploadPercent);
                _this.$coverRetryButton.find('i').hide();
                _this.$coverRetryButton.find('b').text('取消上传');
                _this.$coverRetryButton.show();
                break;
            case 3: // 上传成功
                // data = APIData

                // 更新 id 和 path
                if (data) {
                    _this.$coverContainer.attr('data-id', data.result.id);
                    _this.$coverContainer.attr('data-path', data.result.img_url);
                }

                _this.$coverTipIcon.show();
                _this.$coverTipLabel.text('更换图片');
                _this.$coverRetryButton.hide();
                break;
            case 4: // 上传失败
                // data = Error or APIData
                _this.$coverTipIcon.hide();
                _this.$coverTipLabel.text('图片上传失败');
                _this.$coverRetryButton.find('i').show();
                _this.$coverRetryButton.find('b').text('重新选择');
                _this.$coverRetryButton.show();
                break;
            default:break;
        }
    }

    handleCoverClick() {
        let _this = this;

        switch (_this.status) {
            case 0: // 初始化状态，没有选择图片点击
                _this.choosePictureAndUpload();
                break;
            case 1: // 选择了图片点击
                break;
            case 2: // 上传中点击
                // 取消上传
                if (_this.uploadRequest) {
                    _this.uploadRequest.abort();
                }
                _this.updateUI(0);
                break;
            case 3: // 上传成功点击
                _this.choosePictureAndUpload();
                break;
            case 4: // 上传失败点击
                _this.choosePictureAndUpload();
                break;
            default:break;
        }
    }

    choosePictureAndUpload() {
        let _this = this;

        choosePicture({
            multiple: false,
            onChange: function (files) {
                let file = files[0];
                if (!file) {
                    return
                }

                if(_this.coverURL) {
                    URL.revokeObjectURL(_this.coverURL);
                }

                if (_this.uploadRequest) {
                    _this.uploadRequest.abort();
                }

                // 选择了图片
                let url = URL.createObjectURL(file);
                _this.updateUI(1, url);

                // 开始上传
                _this.uploadRequest = uploadPicture({
                    file: file,
                    watermark: false,
                    progress: function (percent) {
                        _this.updateUI(2, percent);
                    },
                    success: function (data) {
                        try {
                            if (data.result.img_url) {
                                // 封面图片发生改变通知
                                native.cell({__action: 'coverOnChange'});
                                _this.updateUI(3, data);
                            } else {
                                _this.updateUI(4, data);
                            }
                        } catch (err) {
                            _this.updateUI(4, err);
                        }
                    }, error: function (err) {
                        _this.updateUI(4, err);
                    }
                });
            }
        });
    }
}

let coverImageManager = new CoverImageManager();

let native = {
    cell: function (json) {
        // Android
        disposeAndroidJson(json)
    },
    callback: function (json) {
        // ...
        disposeAndroidCallback(json)
    }
};
