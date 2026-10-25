package com.crm.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public final class JsonUtil {

    private static final Gson GSON =
            new GsonBuilder()
                    .serializeNulls()
                    .registerTypeAdapter(java.time.LocalDate.class, (com.google.gson.JsonSerializer<java.time.LocalDate>) (src, typeOfSrc, context) ->
                            src == null ? null : new com.google.gson.JsonPrimitive(src.toString()))
                    .registerTypeAdapter(java.time.LocalDate.class, (com.google.gson.JsonDeserializer<java.time.LocalDate>) (json, typeOfT, context) ->
                            json == null || json.getAsString().isBlank() ? null : java.time.LocalDate.parse(json.getAsString().substring(0, 10)))
                    .registerTypeAdapter(java.time.LocalDateTime.class, (com.google.gson.JsonSerializer<java.time.LocalDateTime>) (src, typeOfSrc, context) ->
                            src == null ? null : new com.google.gson.JsonPrimitive(src.toString()))
                    .registerTypeAdapter(java.time.LocalDateTime.class, (com.google.gson.JsonDeserializer<java.time.LocalDateTime>) (json, typeOfT, context) ->
                            json == null || json.getAsString().isBlank() ? null : java.time.LocalDateTime.parse(json.getAsString()))
                    .registerTypeAdapter(java.time.Instant.class, (com.google.gson.JsonSerializer<java.time.Instant>) (src, typeOfSrc, context) ->
                            src == null ? null : new com.google.gson.JsonPrimitive(src.toString()))
                    .registerTypeAdapter(java.time.Instant.class, (com.google.gson.JsonDeserializer<java.time.Instant>) (json, typeOfT, context) ->
                            json == null || json.getAsString().isBlank() ? null : java.time.Instant.parse(json.getAsString()))
                    .registerTypeAdapter(java.util.Date.class, (com.google.gson.JsonSerializer<java.util.Date>) (src, typeOfSrc, context) ->
                            src == null ? null : new com.google.gson.JsonPrimitive(src.toInstant().toString()))
                    .registerTypeAdapter(java.sql.Timestamp.class, (com.google.gson.JsonSerializer<java.sql.Timestamp>) (src, typeOfSrc, context) ->
                            src == null ? null : new com.google.gson.JsonPrimitive(src.toInstant().toString()))
                    .registerTypeAdapter(java.sql.Date.class, (com.google.gson.JsonSerializer<java.sql.Date>) (src, typeOfSrc, context) ->
                            src == null ? null : new com.google.gson.JsonPrimitive(src.toString()))
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