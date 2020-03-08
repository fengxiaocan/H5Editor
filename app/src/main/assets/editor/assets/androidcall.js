

function disposeAndroidJson(_action){
//    if(_action.__action == 'editorOnEvent'){
        printMessage(JSON.stringify(_action));
//    }else{
//        postBean(_action);
//    }
}

function disposeAndroidCallback(_action){
//    if(_action.__action == 'editorOnEvent'){
        printMessage(JSON.stringify(_action));
//    }else{
//        postBean(_action);
//    }
}


//回调android 打印日志信息
function printMessage(json){
//    window.AndroidEditor.postMessage(JSON.stringify(json));
    window.AndroidEditor.postMessage(json);
}

//回调android 打印日志信息
function postBean(bean){
//    window.AndroidEditor.postMessage(JSON.stringify(json));
    window.AndroidEditor.postBean(bean);
}

//格式化为加粗
formatTextBold: function () {
    let range = quill.getSelection();
    if (range == null ) {
        return
    }

    quill.formatText(range.index,range.index+range.length'bold', true)
}