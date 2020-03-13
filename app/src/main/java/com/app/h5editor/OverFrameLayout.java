package com.app.h5editor;

import android.app.Activity;
import android.content.Context;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import java.util.ArrayList;
import java.util.List;

public class OverFrameLayout extends FrameLayout{

    public OverFrameLayout(@NonNull Context context){
        super(context);
    }

    public OverFrameLayout(@NonNull Context context,@Nullable AttributeSet attrs){
        super(context,attrs);
    }

    public OverFrameLayout(@NonNull Context context,@Nullable AttributeSet attrs,int defStyleAttr){
        super(context,attrs,defStyleAttr);
    }

    public OverFrameLayout(@NonNull Context context,@Nullable AttributeSet attrs,int defStyleAttr,int defStyleRes){
        super(context,attrs,defStyleAttr,defStyleRes);
    }


    @Override
    protected void onSizeChanged(int w,int h,int oldw,int oldh){
        super.onSizeChanged(w,h,oldw,oldh);
        Log.e("noah","onLayout h="+h+" oldh="+oldh);
    }

    public void attachActivity(Activity activity){
        View view = activity.findViewById(android.R.id.content);
        ViewParent parent = view.getParent().getParent();
        ViewGroup group = (ViewGroup)parent;
//
        ViewGroup.LayoutParams layoutParams = group.getLayoutParams();
        setLayoutParams(layoutParams);
        setClipChildren(group.getClipChildren());
        setWillNotDraw(group.willNotDraw());
        setBackground(group.getBackground());
        setAlpha(group.getAlpha());

        List<View> views = new ArrayList<>();
        for(int i = 0;i < group.getChildCount();i++){
            View childAt = group.getChildAt(i);
            views.add(childAt);
        }
        for(View view1: views){
            group.removeView(view1);
            addView(view1);
        }
        ViewGroup viewParent = ((ViewGroup)group.getParent());
        viewParent.removeView(group);
        viewParent.addView(this);
    }

}
