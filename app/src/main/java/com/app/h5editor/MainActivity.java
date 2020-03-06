package com.app.h5editor;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity{

    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mWebView = findViewById(R.id.web_view);
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

        mWebView.addJavascriptInterface(new JSInterface (),"AndroidEditor");
        //2.解决https与http混加载问题
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP){
            webSetting.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        mWebView.loadUrl("file:///android_asset/editor/index.html");
    }

    public static class JSInterface {
        @JavascriptInterface
        public void postMessage(String json){
            Log.e("noah",json);
        }
    }
}
