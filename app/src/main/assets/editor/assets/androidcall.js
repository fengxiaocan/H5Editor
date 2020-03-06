

function disposeAndroidJson(_action){
//    window.AndroidEditor.postMessage(JSON.stringify(json));
    if(_action.__action == 'editorOnEvent'){
        printMessage(JSON.stringify(_action));
    }
}


//回调android 打印日志信息
function printMessage(json){
//    window.AndroidEditor.postMessage(JSON.stringify(json));
    window.AndroidEditor.postMessage(json);
}