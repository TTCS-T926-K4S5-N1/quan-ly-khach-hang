package com.crm.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public final class JsonUtil {

    private static final Gson GSON =
            new GsonBuilder()
                    .serializeNulls()
                    .create();

    public static final java.lang.reflect.Type OBJECT_MAP_TYPE =
            new com.google.gson.reflect.TypeToken<java.util.Map<String, Object>>() {}.getType();

    /** Validate untrusted JSON arrays without unchecked casts or coercing invalid keys. */
    public static java.util.List<java.util.Map<String, Object>> objectList(Object value) {
        if (value == null) return null;
        if (!(value instanceof java.util.List<?> items)) {
            throw new IllegalArgumentException("items phải là danh sách");
        }
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (Object item : items) {
            if (!(item instanceof java.util.Map<?, ?> map)) {
                throw new IllegalArgumentException("Mỗi phần tử items phải là object");
            }
            java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
            for (java.util.Map.Entry<?, ?> entry : map.entrySet()) {
                if (!(entry.getKey() instanceof String key)) {
                    throw new IllegalArgumentException("Key của items phải là chuỗi");
                }
                row.put(key, entry.getValue());
            }
            result.add(row);
        }
        return result;
    }

    private JsonUtil() {
    }

    public static Gson getGson() {
        return GSON;
    }
}