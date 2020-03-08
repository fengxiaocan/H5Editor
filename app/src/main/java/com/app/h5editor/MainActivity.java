package com.app.h5editor;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.luck.picture.lib.PictureSelector;
import com.luck.picture.lib.config.PictureConfig;
import com.luck.picture.lib.config.PictureMimeType;

import static com.app.h5editor.MainActivity.JSInterface.FORMAT_BOLD;
import static com.app.h5editor.MainActivity.JSInterface.INSER_DIVIDER;
import static com.app.h5editor.MainActivity.JSInterface.REMOVE_FOCUS;

/**
 *  编辑器网址:https://quilljs.com
 */
public class MainActivity extends AppCompatActivity {

    private WebView mWebView;
    private TextView tvBold;
    private TextView tvPhoto;
    private TextView tvLine;
    private TextView tvHide;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initView();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermissions(new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, 0x123);
        }

        initData();
    }

    private void initData() {
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

        mWebView.addJavascriptInterface(new JSInterface(this), "AndroidEditor");
        //2.解决https与http混加载问题
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSetting.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        mWebView.loadUrl("file:///android_asset/editor/index.html");
    }

    private void initView() {
        mWebView = findViewById(R.id.web_view);

        tvBold = (TextView) findViewById(R.id.tv_bold);
        tvPhoto = (TextView) findViewById(R.id.tv_photo);
        tvLine = (TextView) findViewById(R.id.tv_line);
        tvHide = (TextView) findViewById(R.id.tv_hide);
        tvBold.setOnClickListener(v -> mWebView.evaluateJavascript(FORMAT_BOLD, null));
        tvPhoto.setOnClickListener(v -> {
        }
        );

        //添加分割线
        tvLine.setOnClickListener(v -> mWebView.evaluateJavascript(INSER_DIVIDER, null));
        tvHide.setOnClickListener(v -> {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.showSoftInput(mWebView, InputMethodManager.SHOW_FORCED);
            imm.hideSoftInputFromWindow(mWebView.getWindowToken(), 0); //强制隐藏键盘
            mWebView.evaluateJavascript(REMOVE_FOCUS, null);
        });
    }

    public static class JSInterface {
        //插入分割线
        public static final String INSER_DIVIDER = "javascript:quill.ext.insertDivider();";
        //把文本格式化为粗体
        public static final String FORMAT_BOLD = "javascript:quill.getSelection().formatText('bold', true);";
        //移除焦点
        public static final String REMOVE_FOCUS = "javascript:quill.blur();";

        Activity context;

        public JSInterface(Activity context) {
            this.context = context;
        }

        @JavascriptInterface
        public void postMessage(String json) {
            Log.e("noah", json);
        }

        @JavascriptInterface
        public void selectPhoto() {
            Log.e("noah", "选择图片");

            PictureSelector.create(context).openGallery(PictureMimeType.ofImage()).
                    loadImageEngine(GlideEngine.createGlideEngine())//请参考演示GlideEngine.java
                    .forResult(PictureConfig.CHOOSE_REQUEST);
        }
    }

}
