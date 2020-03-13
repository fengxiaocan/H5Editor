package com.app.h5editor;

import android.Manifest;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.box.libs.DebugBox;
import com.luck.picture.lib.PictureSelector;
import com.luck.picture.lib.config.PictureMimeType;
import com.luck.picture.lib.entity.LocalMedia;

import static com.app.h5editor.MainActivity.JSInterface.CHOOSE_PICTURE;
import static com.app.h5editor.MainActivity.JSInterface.FORMAT_BOLD;
import static com.app.h5editor.MainActivity.JSInterface.FORMAT_UNBOLD;
import static com.app.h5editor.MainActivity.JSInterface.INSER_DIVIDER;
import static com.app.h5editor.MainActivity.JSInterface.REMOVE_FOCUS;

/**
 * 编辑器网址:https://quilljs.com
 */
public class MainActivity extends AppCompatActivity {

    private WebView mWebView;
    private TextView tvBold;
    private TextView tvPhoto;
    private TextView tvLine;
    private TextView tvHide;
    private LinearLayout mLayoutBottom;
    private boolean isTextBold = false;
    private ValueCallback<Uri[]> fileChooseCallback = null;

    @Override
    protected void onCreate(Bundle savedInstanceState){
        DebugBox.init(getApplication());
        new OverFrameLayout(this).attachActivity(this);
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);

        initView();

        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.M){
            requestPermissions(new String[]{Manifest.permission.READ_EXTERNAL_STORAGE},0x123);
        }

        initData();
        DebugBox.get().open();
    }

    private void initData(){
        WebSettings webSetting = mWebView.getSettings();
        webSetting.setDisplayZoomControls(false);
        webSetting.setAllowUniversalAccessFromFileURLs(true);
        webSetting.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSetting.setSaveFormData(true);
        webSetting.setJavaScriptEnabled(true);
        webSetting.setLoadWithOverviewMode(true);
        webSetting.setPluginState(WebSettings.PluginState.ON);
        webSetting.setDomStorageEnabled(true);
        webSetting.setAllowFileAccess(true);
        webSetting.setAppCacheEnabled(true);
        webSetting.setDatabaseEnabled(true);
        webSetting.setUseWideViewPort(true);
        webSetting.setAllowFileAccessFromFileURLs(true);
        webSetting.setSupportZoom(false);
        webSetting.setRenderPriority(WebSettings.RenderPriority.HIGH);
        webSetting.setBuiltInZoomControls(false);
        webSetting.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NARROW_COLUMNS);
        webSetting.setJavaScriptCanOpenWindowsAutomatically(true);
        webSetting.setLoadsImagesAutomatically(true);
        webSetting.setMediaPlaybackRequiresUserGesture(false);
        webSetting.setBlockNetworkImage(false);//解决图片不显示
        webSetting.setGeolocationEnabled(true);
        webSetting.setAppCacheMaxSize(Long.MAX_VALUE);
        webSetting.setDefaultTextEncodingName("UTF-8");
        //webSetting.setDefaultTextEncodingName("GBK");//设置字符编码
        //android 默认是可以打开_bank的，是因为它默认设置了WebSettings.setSupportMultipleWindows(false)
        //在false状态下，_bank也会在当前页面打开……
        //而x5浏览器，默认开启了WebSettings.setSupportMultipleWindows(true)，
        // 所以打不开……主动设置成false就可以打开了
        //需要支持多窗体还需要重写WebChromeClient.onCreateWindow
        webSetting.setSupportMultipleWindows(false);

        mWebView.addJavascriptInterface(new JSInterface(),"AndroidEditor");
        //2.解决https与http混加载问题
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP){
            webSetting.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        mWebView.setWebChromeClient(new WebChromeClient(){
            @Override
            public boolean onShowFileChooser(WebView webView,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams)
            {
                fileChooseCallback = filePathCallback;
                PictureSelector.create(MainActivity.this).openGallery(PictureMimeType.ofImage()).
                        loadImageEngine(GlideEngine.createGlideEngine())//请参考演示GlideEngine.java
                               .forResult(result -> {
                                   if(result == null || result.size() == 0){
                                       filePathCallback.onReceiveValue(new Uri[1]);
                                   } else{
                                       Uri[] value = new Uri[result.size()];
                                       for(int i = 0;i < result.size();i++){
                                           LocalMedia media = result.get(i);
                                           value[i] = Uri.parse(media.getPath());
                                       }
                                       filePathCallback.onReceiveValue(value);
                                   }
                                   fileChooseCallback = null;
                               });
                return true;
            }
        });
        mWebView.loadUrl("file:///android_asset/editor/index.html");
    }

    @Override
    protected void onResume(){
        super.onResume();
        if(fileChooseCallback != null){
            fileChooseCallback.onReceiveValue(null);
        }
    }

    private void initView(){
        mWebView = findViewById(R.id.web_view);
        mLayoutBottom = findViewById(R.id.layout_bottom);
        tvBold = findViewById(R.id.tv_bold);
        tvPhoto = findViewById(R.id.tv_photo);
        tvLine = findViewById(R.id.tv_line);
        tvHide = findViewById(R.id.tv_hide);
        tvBold.setOnClickListener(v -> {
            isTextBold = ! isTextBold;
            if(isTextBold){
                mWebView.evaluateJavascript(FORMAT_BOLD,null);
            } else{
                mWebView.evaluateJavascript(FORMAT_UNBOLD,null);
            }
            tvBold.getPaint().setFakeBoldText(isTextBold);
            tvBold.postInvalidate();
        });
        tvPhoto.setOnClickListener(v -> {
            mWebView.evaluateJavascript(CHOOSE_PICTURE,null);
        });

        //添加分割线
        tvLine.setOnClickListener(v -> mWebView.evaluateJavascript(INSER_DIVIDER,null));
        tvHide.setOnClickListener(v -> {
            //            InputMethodManager imm = (InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
            //            imm.showSoftInput(mWebView,InputMethodManager.SHOW_FORCED);
            //            imm.hideSoftInputFromWindow(mWebView.getWindowToken(),0); //强制隐藏键盘
            mWebView.evaluateJavascript(REMOVE_FOCUS,null);
            //            mLayoutBottom.setVisibility(View.GONE);
        });

    }

    public class JSInterface{
        //插入分割线
        public static final String INSER_DIVIDER = "javascript:quill.ext.insertDivider();";
        //把文本格式化为粗体
        public static final String FORMAT_BOLD = "javascript:quill.ext.formatTextBold(true);";
        //把文本格式化为正常体
        public static final String FORMAT_UNBOLD = "javascript:quill.ext.formatTextBold(false);";
        //选择图片
        public static final String CHOOSE_PICTURE = "javascript:quill.ext.insertImage();";
        //移除焦点
        public static final String REMOVE_FOCUS = "javascript:quill.blur();";
        //给上传接口设置token
        public static final String SESSION_STORAGE = "javascript:sessionStorage.setItem('authorization','%s');";

        /**
         * 打印日志信息
         *
         * @param json
         */
        @JavascriptInterface
        public void postMessage(String json){
            Log.e("noah",json);
        }

        /**
         * 是否是粗体
         *
         * @param isBold
         */
        @JavascriptInterface
        public void callBoldChange(boolean isBold){
            isTextBold = isBold;
            tvBold.getPaint().setFakeBoldText(isBold);
            tvBold.postInvalidate();
        }

        /**
         * 焦点改变通知
         *
         * @param name
         */
        @JavascriptInterface
        public void callOnFocusChange(String name){
            if("body".equals(name)){
                runOnUiThread(() -> {
                    mLayoutBottom.setVisibility(View.VISIBLE);
                    mLayoutBottom.requestLayout();
                });
            } else{
                runOnUiThread(() -> mLayoutBottom.setVisibility(View.GONE));
            }
        }

        /**
         * 是否能够发布
         *
         * @param canPublish
         */
        @JavascriptInterface
        public void callOnPublish(boolean canPublish){
            Log.e("noah","callOnPublish=" + canPublish);
        }

        /**
         * 编辑器内容改变
         *
         * @param coverUrl
         * @param title
         * @param html
         */
        @JavascriptInterface
        public void callOnEditorChange(String coverUrl,String title,String html){
            Log.e("noah","callOnEditorChange=" + html);
        }
    }

}
