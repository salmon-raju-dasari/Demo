package com.example.supermarket;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Allow mixed content for development
        // This overrides the default https://localhost/ to use http://localhost/
        // Note: Only use this for development, not production
    }
}
