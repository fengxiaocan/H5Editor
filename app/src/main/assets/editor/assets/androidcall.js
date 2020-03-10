
//editor.js 跟Android交互的唯一方法桥梁
function disposeAndroidJson(_action){
    if(_action.__action == 'editorOnEvent'){
//        printMessage(JSON.stringify(_action));
        if(_action.event == 'bold-change'){
            callBoldChange(_action.value.bold);
        }else if(_action.event == 'selection-change'){
            let focusName = quill.ext.getFocusInputName();
            callOnFocusChange(focusName)
            if(focusName == 'body'){
                 quill.ext.getBoldStatus();
            }
        }else{
            //text-change
            callOnChange();
            quill.ext.getBoldStatus();
        }
    }else if(_action.__action == 'editorOnFocusChange'){
        //焦点改变 _action.inputName == 'title' or 'body'
        callOnFocusChange(_action.inputName)
    }else if(_action.__action == 'titleOnTextChange'){
        //标题改变,获取标题的长度
        callOnChange();
    }else{
        printMessage(JSON.stringify(_action));
    }
}

//回调android 打印日志信息
function printMessage(json){
    window.AndroidEditor.postMessage(json);
}

//回调android 获取是否粗细字体的方法
function callBoldChange(bold){
    window.AndroidEditor.callBoldChange(bold);
}
//回调android 当前焦点改变:title or body
function callOnFocusChange(name){
    window.AndroidEditor.callOnFocusChange(name);
}

//回调android 是否能够发布
function callOnChange(){
    let content = quill.ext.getContent()
    let publish = isNoEmpty(content.coverURL)
    && isNoEmpty(content.titleText)
    && getCharLength(content.titleText) < 41
    && isNoEmpty(content.bodyHTML);
    //判断是否能够发布
    window.AndroidEditor.callOnPublish(publish);
    //回调内容发生改变的方法
    window.AndroidEditor.callOnEditorChange(content.coverURL,content.titleText,content.bodyHTML);
}
//判断字符串是否为空
function isNoEmpty(value){
    return value != null && value.length > 0;
}
//获取文本字节长度,一个英文半个字符,一个汉字一个字符
function getCharLength(value){
     let n = value.trim().replace(/[^\x00-\xff]/g,"aa").length/2;
     return Math.ceil(n);
}



